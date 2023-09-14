import isEqual from 'fast-deep-equal';
import { JSDOM } from 'jsdom';
import {
  differenceBy,
  map,
  pick,
  random,
  sample,
  shuffle,
  uniqBy,
} from 'lodash';
import { DateTime } from 'luxon';
import { arg, extendType, nonNull } from 'nexus';
import {
  AuthTypeEnum,
  BranchTypeEnum,
  Organization,
  Prisma,
  Tool,
  User,
  UserGroup,
  Workflow,
} from 'prisma-client';

import { fromHTML } from '@kenchi/slate-tools/lib/fromHTML';
import { ToolInput } from '@kenchi/slate-tools/lib/tool/types';
import { SlateNode } from '@kenchi/slate-tools/lib/types';

import { ViewerContext } from '../../auth/contextType';
import { getDB } from '../../db';
import { ToolModel, WorkflowModel } from '../../models';
import { queueToolMutation, queueWorkflowMutation } from '../../queue';
import { encodeId, generateStaticId, requireAdmin } from '../../utils';
import {
  executeCreate,
  executeDelete,
  executeUpdate,
  PrismaInputToNexusCreateInput,
} from '../utils/versionedNodeModify';
import {
  DEFAULT_MAX_DAILY_PLAYBOOK_VIEWS,
  DEFAULT_MAX_DAILY_SNIPPET_RUNS,
  DEMO_COLLECTIONS,
  DEMO_COMMENTS,
  DEMO_USERS,
  DemoCollectionData,
  DemoToolData,
  DemoWorkflowData,
} from './demoContent';

type DemoUser = User & { groupMemberships: { userGroup: UserGroup }[] };

export const BulkUpdate = extendType({
  type: 'Mutation',
  definition(t) {
    t.boolean('updateDemoAccount', {
      args: {
        from: nonNull(arg({ type: 'DateTime' })),
      },
      async resolve(_root, { from: fromRaw }, ctx) {
        requireAdmin();
        validateDemoContent();

        const maybeDemoOrg = await ctx.db.organization.findFirst({
          where: { googleDomain: 'kenchi.team' },
        });
        let demoOrg: Organization;
        if (maybeDemoOrg) {
          demoOrg = await ctx.db.organization.update({
            where: { id: maybeDemoOrg.id },
            data: {
              googleDomain: 'kenchi.team',
              name: 'Demo Account',
              settings: {
                intercomAccessToken: 'set_to_something',
              },
            },
          });
        } else {
          demoOrg = await ctx.db.organization.create({
            data: {
              shadowRecord: false,
              googleDomain: 'kenchi.team',
              name: 'Demo Account',
              settings: {
                intercomAccessToken: 'set_to_something',
              },
            },
          });
        }

        const from = DateTime.fromJSDate(fromRaw).startOf('day');

        const updater = new DemoAccountUpdater(
          demoOrg,
          ctx.viewerContext?.user.id,
          from
        );
        await updater.run();

        return true;
      },
    });
  },
});

function parseHTML(html: string) {
  const parsed = new JSDOM(html);
  const body = parsed.window.document.body;
  return fromHTML(body, {
    splitOnBr: false,
    onImage: () => true,
    doubleParagraphs: false,
  });
}

function findInputs(nodes: SlateNode[]) {
  const inputs: ToolInput[] = [];
  for (const node of nodes) {
    if (node.type === 'variable') {
      inputs.push({
        id: node.id,
        placeholder: node.placeholder,
        source: node.source,
      });
    } else if (node.children) {
      inputs.push(...findInputs(node.children));
    }
  }
  return uniqBy(inputs, 'id');
}

function handleEmbeddedObjects(
  contents: SlateNode[],
  nameToIdMap: Record<string, string>
) {
  for (const node of contents) {
    if (node.type === 'tool') {
      const newId = nameToIdMap[node.tool];
      if (newId) {
        node.tool = newId;
      } else {
        console.log('Needs to be run again'); // TODO: automate this?
      }
    } else if (node.children) {
      handleEmbeddedObjects(node.children, nameToIdMap);
    }
  }
}

function validateDemoContent() {
  // We use name as a lookup key to cross-reference workflows and tools
  const collectionNames = new Set<string>();
  const toolNames = new Set<string>();
  const workflowNames = new Set<string>();
  DEMO_COLLECTIONS.forEach((collection) => {
    if (collectionNames.has(collection.name)) {
      throw new Error(`Duplicate collection name: ${collection.name}`);
    }
    collectionNames.add(collection.name);

    collection.tools.forEach(({ name }) => {
      if (toolNames.has(name)) {
        throw new Error(`Duplicate tool name: ${name}`);
      }
      toolNames.add(name);
    });
    collection.workflows.forEach(({ name }) => {
      if (workflowNames.has(name)) {
        throw new Error(`Duplicate workflow name: ${name}`);
      }
      workflowNames.add(name);
    });
  });
}

// [rating, relative portion of ratings] (does not need to sum to 1). CSAT is
// the % of 4s and 5s, so tweak those two to get a certain aggregate score
const RATING_DISTRIBUTION: [number, number][] = [
  [1, 0.04],
  [2, 0.02],
  [3, 0.04],
  [4, 0.25],
  [5, 0.65],
];
const RATING_DISTRIBUTION_SUM = RATING_DISTRIBUTION.reduce(
  (sum, row) => sum + row[1],
  0
);

const PERCENT_OF_CONVERSATIONS_WITH_RATINGS = 0.4;
const PERCENT_OF_RATINGS_WITH_COMMENTS = 0.05;

function getRating() {
  const ratingPicker = random(RATING_DISTRIBUTION_SUM, true);
  let ratingSum = 0;
  for (const [rating, distribution] of RATING_DISTRIBUTION) {
    ratingSum += distribution;
    if (ratingPicker <= ratingSum) {
      return rating;
    }
  }
  throw new Error('Should be impossible');
}

class DemoAccountUpdater {
  private users: DemoUser[] = [];
  private conversationIdPrefix;
  private conversationIdsToDate: Record<string, DateTime> = {};
  private shuffledComments: Record<number, string[]> = {};

  constructor(
    private organization: Organization,
    private originalUserId: number | undefined,
    private from: DateTime
  ) {
    this.conversationIdPrefix = generateStaticId('demo');
  }

  public async run() {
    await this.reconcileUsers();

    await Promise.all(DEMO_COLLECTIONS.map((c) => this.reconcileCollection(c)));

    await this.addInsights();

    // TODO: also archive tools/workflows in existing collections that shouldn't exist anymore

    const collectionsToArchive = await getDB().collection.findMany({
      where: {
        name: { notIn: map(DEMO_COLLECTIONS, 'name') },
        organizationId: this.organization.id,
        isArchived: false,
      },
    });
    for (const collectionToArchive of collectionsToArchive) {
      const toolsToArchive = await getDB().tool.findMany({
        where: {
          collectionId: collectionToArchive.id,
          isArchived: false,
          isLatest: true,
        },
      });
      await Promise.all(
        toolsToArchive.map(async (t) => {
          const { model } = await executeDelete<
            Prisma.ToolUncheckedCreateInput,
            Tool
          >(
            'publish_tool',
            encodeId('trev', t.id),
            ToolModel.preservableFields,
            this.randomUserContext(),
            getDB().tool
          );
          if (model) {
            await queueToolMutation(model.id, 'delete');
          }
        })
      );

      const workflowsToArchive = await getDB().workflow.findMany({
        where: {
          collectionId: collectionToArchive.id,
          isArchived: false,
          isLatest: true,
        },
      });
      await Promise.all(
        workflowsToArchive.map(async (w) => {
          const { model } = await executeDelete<
            Prisma.WorkflowUncheckedCreateInput,
            Workflow
          >(
            'publish_workflow',
            encodeId('wrev', w.id),
            WorkflowModel.preservableFields,
            this.randomUserContext(),
            getDB().workflow
          );
          if (model) {
            await queueWorkflowMutation(model.id, 'delete');
          }
        })
      );

      await getDB().collection.update({
        where: { id: collectionToArchive.id },
        data: { isArchived: true },
      });
    }
  }

  private async reconcileUsers() {
    this.users = await getDB().user.findMany({
      include: { groupMemberships: { select: { userGroup: true } } },
      where: { organizationId: this.organization.id },
    });

    const newUsers = differenceBy(DEMO_USERS, this.users, 'email');
    if (newUsers.length > 0) {
      for (const newUser of DEMO_USERS) {
        this.users.push(
          await getDB().user.create({
            include: { groupMemberships: { select: { userGroup: true } } },
            data: {
              organizationId: this.organization.id,
              email: newUser.email,
              givenName: newUser.firstName,
              name: `${newUser.firstName} ${newUser.lastName}`,
              googleId: `NOT_SET_${newUser.email}`,
              isOrganizationAdmin: true,
            },
          })
        );
      }
    }
  }

  private async reconcileCollection(details: DemoCollectionData) {
    const organizationId = this.organization.id;

    let collection = await getDB().collection.findFirst({
      where: {
        organizationId,
        name: details.name,
      },
    });
    if (!collection) {
      collection = await getDB().collection.create({
        data: {
          organizationId,
          name: details.name,
          icon: details.icon,
          description: details.description,
        },
      });
    }

    const collectionId = collection.id;

    await getDB().collection.update({
      where: { id: collectionId },
      data: {
        organizationId,
        icon: details.icon,
        description: details.description,
        defaultPermissions: ['publisher'],
      },
    });

    const existingTools = await getDB().tool.findMany({
      where: {
        collection: { organizationId },
        isLatest: true,
        isArchived: false,
        branchType: BranchTypeEnum.published,
      },
    });

    await Promise.all(
      details.tools.map((tool) =>
        this.reconcileTool(
          collectionId,
          existingTools.find((t) => t.name === tool.name),
          tool
        )
      )
    );

    const existingWorkflows = await getDB().workflow.findMany({
      where: {
        collection: { organizationId },
        isLatest: true,
        isArchived: false,
        branchType: BranchTypeEnum.published,
      },
    });

    const existingNameMap: Record<string, string> = {};
    existingTools.forEach(
      ({ name, staticId }) => (existingNameMap[name] = staticId)
    );
    existingWorkflows.forEach(
      ({ name, staticId }) => (existingNameMap[name] = staticId)
    );

    await Promise.all(
      details.workflows.map((workflow) =>
        this.reconcileWorkflow(
          collectionId,
          existingWorkflows.find((w) => w.name === workflow.name),
          workflow,
          existingNameMap
        )
      )
    );
  }

  private async reconcileTool(
    collectionId: number,
    existingTool: Tool | undefined,
    toolData: DemoToolData
  ) {
    const children = parseHTML(toolData.contents);
    const inputs = findInputs(children);
    const configuration = {
      data: {
        slate: true,
        singleLine: false,
        rich: true,
        children,
      },
    };
    const fields = {
      branchType: BranchTypeEnum.published,
      collectionId: encodeId('coll', collectionId),
      component: 'GmailAction',
      configuration,
      name: toolData.name,
      description: toolData.description,
      icon: toolData.icon,
      inputs,
    };
    const tool = await this.upsertTool(existingTool, fields);
    await this.populateUsageData(
      tool.staticId,
      (toolData.usageMultiple ?? 1) * DEFAULT_MAX_DAILY_SNIPPET_RUNS,
      getDB().userToolRun,
      'runAt'
    );
  }

  private async upsertTool(
    existingTool: Tool | undefined,
    fields: PrismaInputToNexusCreateInput<Prisma.ToolUncheckedCreateInput>
  ) {
    let result;
    let type: 'create' | 'update';
    if (existingTool) {
      const existingFields = {
        ...pick(existingTool, Object.keys(fields)),
        collectionId: encodeId('coll', existingTool.collectionId),
      };
      if (!isEqual(fields, existingFields)) {
        result = await executeUpdate<Prisma.ToolUncheckedCreateInput, Tool>(
          'publish_tool',
          ToolModel.branchIdPrefix,
          encodeId('trev', existingTool.id),
          fields,
          ToolModel.preservableFields,
          this.randomUserContext(),
          getDB().tool
        );
        type = 'update';
      } else {
        return existingTool;
      }
    } else {
      result = await executeCreate<Prisma.ToolUncheckedCreateInput, Tool>(
        'publish_tool',
        ToolModel.staticIdPrefix,
        ToolModel.branchIdPrefix,
        fields,
        this.randomUserContext(),
        getDB().tool
      );
      type = 'create';
    }
    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    } else {
      await queueToolMutation(result.model.id, type);
      return result.model;
    }
  }

  private async reconcileWorkflow(
    collectionId: number,
    existingWorkflow: Workflow | undefined,
    workflowData: DemoWorkflowData,
    nameToIdMap: Record<string, string>
  ) {
    const contents = parseHTML(workflowData.contents);
    handleEmbeddedObjects(contents, nameToIdMap);
    const fields = {
      branchType: BranchTypeEnum.published,
      collectionId: encodeId('coll', collectionId),
      contents,
      name: workflowData.name,
      description: workflowData.description,
      icon: workflowData.icon,
    };

    const workflow = await this.upsertWorkflow(existingWorkflow, fields);
    await this.populateUsageData(
      workflow.staticId,
      (workflowData.usageMultiple ?? 1) * DEFAULT_MAX_DAILY_PLAYBOOK_VIEWS,
      getDB().userWorkflowView,
      'viewedAt'
    );
  }

  private async upsertWorkflow(
    existingWorkflow: Workflow | undefined,
    fields: PrismaInputToNexusCreateInput<Prisma.WorkflowUncheckedCreateInput>
  ) {
    let result;
    let type: 'create' | 'update';
    if (existingWorkflow) {
      const existingFields = {
        ...pick(existingWorkflow, Object.keys(fields)),
        collectionId: encodeId('coll', existingWorkflow.collectionId),
      };
      if (!isEqual(fields, existingFields)) {
        result = await executeUpdate<
          Prisma.WorkflowUncheckedCreateInput,
          Workflow
        >(
          'publish_workflow',
          WorkflowModel.branchIdPrefix,
          encodeId('wrev', existingWorkflow.id),
          fields,
          WorkflowModel.preservableFields,
          this.randomUserContext(),
          getDB().workflow
        );
        type = 'update';
      } else {
        return existingWorkflow;
      }
    } else {
      result = await executeCreate<
        Prisma.WorkflowUncheckedCreateInput,
        Workflow
      >(
        'publish_workflow',
        WorkflowModel.staticIdPrefix,
        WorkflowModel.branchIdPrefix,
        fields,
        this.randomUserContext(),
        getDB().workflow
      );
      type = 'create';
    }
    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    } else {
      await queueWorkflowMutation(result.model.id, type);
      return result.model;
    }
  }

  private getConversationId(date: DateTime) {
    const paddedId = Object.keys(this.conversationIdsToDate)
      .length.toString()
      .padStart(5, '0');
    const id = `${this.conversationIdPrefix}_${paddedId}`;
    this.conversationIdsToDate[id] = date;
    return id;
  }

  private getComment(rating: number) {
    if (Math.random() >= PERCENT_OF_RATINGS_WITH_COMMENTS) {
      return null;
    }

    let candidates = this.shuffledComments[rating];
    if (!candidates || candidates.length === 0) {
      candidates = this.shuffledComments[rating] = shuffle(
        DEMO_COMMENTS[rating]
      );
    }
    return candidates.shift();
  }

  private async addInsights() {
    const rows: Prisma.InsightsConversationCreateManyInput[] = [];
    for (const id in this.conversationIdsToDate) {
      if (Math.random() >= PERCENT_OF_CONVERSATIONS_WITH_RATINGS) {
        continue;
      }
      const rating = getRating();
      let remark = null;
      if (Math.random() < PERCENT_OF_RATINGS_WITH_COMMENTS) {
        remark = this.getComment(rating);
      }
      const date = this.conversationIdsToDate[id].toJSDate();
      rows.push({
        organizationId: this.organization.id,
        id,
        rating,
        ratedAt: date,
        startedAt: date,
        updatedAt: date,
        data: { conversation_rating: { remark } },
      });
    }

    return getDB().insightsConversation.createMany({ data: rows });
  }

  private async populateUsageData<TField extends 'viewedAt' | 'runAt'>(
    staticId: string,
    maxUsage: number,
    {
      createMany,
    }: {
      createMany: (args: {
        data: (Record<TField, Date> & {
          userId: number;
          staticId: string;
          conversationId: string;
        })[];
      }) => Promise<Prisma.BatchPayload>;
    },
    timestampName: TField
  ) {
    const middleOfMaxUsage = Math.floor(maxUsage / 2);

    const dates = [];
    for (
      let date = this.from;
      date <= DateTime.now();
      date = date.plus({ days: 1 })
    ) {
      // Weekends are random usage from 0 to maxUsage / 2
      // Weekdays are random usage from maxUsage / 2 to maxUsage
      let usage =
        date.weekday > 5
          ? random(0, middleOfMaxUsage)
          : random(middleOfMaxUsage, maxUsage);
      usage = Math.floor(usage);
      for (let i = 0; i < usage; i++) {
        const offset = random(9 * 60 * 60, 17 * 60 * 60); // 9am - 5pm in seconds
        dates.push(date.plus({ seconds: offset }));
      }
    }
    await createMany({
      data: dates.map(
        (date) =>
          ({
            [timestampName]: date.toJSDate(),
            staticId,
            userId: this.randomUser().id,
            conversationId: this.getConversationId(date),
            // TS has issues with the variable key name
          } as any)
      ),
    });
  }

  private randomUser(): DemoUser {
    return sample(this.users)!;
  }

  private randomUserContext(): ViewerContext {
    const user = this.randomUser();
    return {
      user,
      organization: this.organization,
      authType: AuthTypeEnum.loginAs,
      originalUserId: this.originalUserId,
      _userGroups: map(user.groupMemberships, 'userGroup'),
      _collectionPermissionsCache: {},
    };
  }
}
