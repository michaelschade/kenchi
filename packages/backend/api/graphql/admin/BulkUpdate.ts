import countBy from 'lodash/countBy';
import escapeRegExp from 'lodash/escapeRegExp';
import uniq from 'lodash/uniq';
import {
  booleanArg,
  extendType,
  inputObjectType,
  nonNull,
  objectType,
  stringArg,
} from 'nexus';
import { SourceValue } from 'nexus/dist/typegenTypeHelpers';
import { NexusGenInputs } from 'nexus-typegen';
import { BranchTypeEnum, Prisma, Tool, Workflow } from 'prisma-client';
import { Element, Node } from 'slate';

import Result, { failure, isFailure, success } from '@kenchi/shared/lib/Result';
import { SlateNode } from '@kenchi/slate-tools/lib/types';
import {
  extractVariablesFromSlate,
  isParagraph,
} from '@kenchi/slate-tools/lib/utils';

import { ToolModel, WorkflowModel } from '../../models';
import { expectJsonArray, expectJsonObject } from '../../models/utils';
import { decodeId, getAdminEmail, requireAdmin } from '../../utils';
import { invalidValueError } from '../KenchiError';
import { versionedNodeGeneratedFields } from '../utils/versionedNodeModify';

export const BulkUpdateReplaceInput = inputObjectType({
  name: 'BulkUpdateReplaceInput',
  definition(t) {
    t.nonNull.string('from');
    t.nonNull.string('to');
  },
});

export const BulkUpdateUpdatesInput = inputObjectType({
  name: 'BulkUpdateUpdatesInput',
  definition(t) {
    t.nullable.boolean('isArchived');
    t.nullable.id('collectionId');
    t.nullable.list.nonNull.field('replace', {
      type: 'BulkUpdateReplaceInput',
    });

    // Snippet only
    t.nullable.boolean('removeIntro');
    t.nullable.boolean('removeOutro');
    t.nullable.boolean('fixMissingChildren');
    t.nullable.string('lineBreakRemoval');
  },
});

export const BulkUpdateFiltersInput = inputObjectType({
  name: 'BulkUpdateFiltersInput',
  definition(t) {
    t.nullable.list.nonNull.string('staticIds');
    t.nullable.list.nonNull.string('collectionIds');
    t.nullable.boolean('onlyPublished');
    t.nullable.boolean('includeArchived');
  },
});

export const BulkUpdateOutput = objectType({
  name: 'BulkUpdateOutput',
  definition(t) {
    t.boolean('success');
    t.nullable.field('updatesByType', { type: 'Json' });
    t.nullable.field('error', { type: 'KenchiError' });
  },
});

export const BulkUpdate = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('bulkUpdateTools', {
      type: 'BulkUpdateOutput',
      args: {
        filters: nonNull('BulkUpdateFiltersInput'),
        updates: nonNull('BulkUpdateUpdatesInput'),
        migrationReason: nonNull(stringArg()),
        dryRun: nonNull(booleanArg()),
      },
      async resolve(
        _root,
        { filters, updates: updatesInput, migrationReason, dryRun },
        ctx
      ) {
        requireAdmin();
        const adminUser = await ctx.db.user.findUnique({
          where: { email: 'support@kenchi.com' },
        });
        if (!adminUser) {
          throw new Error('Missing Kenchi bot user');
        }
        const employeeEmail = getAdminEmail(ctx);

        const modelResp = await getModels(ctx.db.tool, filters);
        if (isFailure(modelResp)) {
          return {
            success: false,
            error: modelResp.error,
          };
        }
        const models = modelResp.data;

        const updateTxns: Prisma.Prisma__ToolClient<Tool>[] = [];
        const createTxns: Prisma.Prisma__ToolClient<Tool>[] = [];

        const affectedModels = models.filter((model) => {
          const updates = bulkUpdateTool(model, updatesInput);
          if (!updates) {
            return false;
          }

          const generatedData = versionedNodeGeneratedFields(adminUser, model);
          const preservableData = ToolModel.preservableFields(model);

          const data: Prisma.ToolUncheckedCreateInput = {
            ...generatedData,
            ...preservableData,
            ...updates,
            // These 3 are JSON values, which support null in their output but
            // not their input. Handle fallbacks appropriately.
            configuration:
              updates.configuration ?? preservableData.configuration,
            inputs: updates.inputs ?? preservableData.inputs,
            majorChangeDescription: updates.majorChangeDescription ?? undefined,

            metadata: {
              ...(typeof updates.metadata === 'object' ? updates.metadata : {}),
              migration: { reason: migrationReason, employee: employeeEmail },
            },
          };

          if (!dryRun) {
            updateTxns.push(
              ctx.db.tool.update({
                where: { id: model.id },
                data: { isLatest: false },
              })
            );
            createTxns.push(ctx.db.tool.create({ data }));
          }
          return true;
        });

        if (!dryRun) {
          await ctx.db.$transaction([...updateTxns, ...createTxns]);
        }

        const updatesByType = countBy(affectedModels, 'branchType');
        return { success: true, updatesByType };
      },
    });

    t.field('bulkUpdateWorkflows', {
      type: 'BulkUpdateOutput',
      args: {
        filters: nonNull('BulkUpdateFiltersInput'),
        updates: nonNull('BulkUpdateUpdatesInput'),
        migrationReason: nonNull(stringArg()),
        dryRun: nonNull(booleanArg()),
      },
      async resolve(
        _root,
        { filters, updates: updatesInput, migrationReason, dryRun },
        ctx
      ) {
        requireAdmin();
        const adminUser = await ctx.db.user.findUnique({
          where: { email: 'support@kenchi.com' },
        });
        if (!adminUser) {
          throw new Error('Missing Kenchi bot user');
        }
        const employeeEmail = getAdminEmail(ctx);

        const modelResp = await getModels(ctx.db.workflow, filters);
        if (isFailure(modelResp)) {
          return {
            success: false,
            error: modelResp.error,
          };
        }
        const models = modelResp.data;

        const updateTxns: Prisma.Prisma__WorkflowClient<Workflow>[] = [];
        const createTxns: Prisma.Prisma__WorkflowClient<Workflow>[] = [];

        models.forEach((model) => {
          const generatedData = versionedNodeGeneratedFields(adminUser, model);
          const preservableData = WorkflowModel.preservableFields(model);

          const data: Prisma.WorkflowUncheckedCreateInput = {
            ...generatedData,
            ...preservableData,
            metadata: {
              migration: { reason: migrationReason, employee: employeeEmail },
            },
          };
          if (typeof updatesInput.isArchived === 'boolean') {
            data.isArchived = updatesInput.isArchived;
          }
          if (updatesInput.collectionId) {
            const [, collectionId] = decodeId(updatesInput.collectionId);
            data.collectionId = collectionId;
          }
          if (updatesInput.replace) {
            expectJsonArray(model.contents);
            const replaceRegex = new RegExp(
              updatesInput.replace.map((r) => escapeRegExp(r.from)).join('|'),
              'g'
            );
            const replaceMap = Object.fromEntries(
              updatesInput.replace.map((r) => [r.from, r.to])
            );
            const contents = recursiveReplace(model.contents, (orig: string) =>
              orig.replace(replaceRegex, (matched) => replaceMap[matched])
            );
            if (!contents) {
              throw new Error('Should never get null at top level');
            }
            data.contents = contents;
          }

          if (!dryRun) {
            updateTxns.push(
              ctx.db.workflow.update({
                where: { id: model.id },
                data: { isLatest: false },
              })
            );
            createTxns.push(ctx.db.workflow.create({ data }));
          }
        });

        await ctx.db.$transaction([...updateTxns, ...createTxns]);

        const updatesByType = countBy(models, 'branchType');
        return { success: true, updatesByType };
      },
    });
  },
});

async function getModels<T extends Tool | Workflow>(
  client: {
    findMany: (args: {
      where: {
        isLatest?: boolean;
        isArchived?: boolean;
        branchType?: BranchTypeEnum;
        staticId?: { in: string[] };
        collectionId?: { in: number[] };
      };
    }) => Promise<T[]>;
  },
  {
    staticIds,
    collectionIds,
    onlyPublished,
    includeArchived,
  }: {
    staticIds?: string[] | null;
    collectionIds?: string[] | null;
    onlyPublished?: boolean | null;
    includeArchived?: boolean | null;
  }
): Promise<Result<T[], SourceValue<'KenchiError'>>> {
  onlyPublished ??= true;
  includeArchived ??= false;
  if (staticIds) {
    if (collectionIds) {
      return failure(
        invalidValueError('Cannot specify both staticIds and collectionIds')
      );
    }
    const models = await client.findMany({
      where: {
        staticId: { in: staticIds },
        isLatest: true,
        isArchived: includeArchived ? undefined : false,
        branchType: onlyPublished ? BranchTypeEnum.published : undefined,
      },
    });
    const keyedByStaticIds = countBy(models, 'staticId');
    if (uniq(staticIds).length !== Object.keys(keyedByStaticIds).length) {
      const missingIds = new Set(staticIds);
      models.forEach(({ staticId }) => missingIds.delete(staticId));
      return failure(
        invalidValueError(
          `Unable to find staticIds ${[...missingIds].join(', ')}`
        )
      );
    }
    return success(models);
  } else if (collectionIds) {
    const collectionIdNums = collectionIds.map((id) => decodeId(id)[1]);
    const models = await client.findMany({
      where: {
        collectionId: { in: collectionIdNums },
        isLatest: true,
        isArchived: false,
        branchType: onlyPublished ? BranchTypeEnum.published : undefined,
      },
    });
    return success(models);
  } else {
    return failure(
      invalidValueError('Must specify either staticIds or collectionIds')
    );
  }
}

function recursiveReplace(
  obj: Prisma.JsonValue,
  replace: (orig: string) => string
): [Prisma.JsonValue, boolean] {
  if (Array.isArray(obj)) {
    let replaced = false;
    const newObj = obj.map((o) => {
      const [newO, localReplaced] = recursiveReplace(o, replace);
      replaced ||= localReplaced;
      return newO;
    });
    return [newObj, replaced];
  } else if (obj && typeof obj === 'object') {
    let replaced = false;
    const newObj = Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        const [newV, localReplaced] = v
          ? recursiveReplace(v, replace)
          : [v, false];
        replaced ||= localReplaced;
        return [k, newV];
      })
    );
    return [newObj, replaced];
  } else if (typeof obj === 'string') {
    const newObj = replace(obj);
    return [newObj, newObj !== obj];
  } else {
    return [obj, false];
  }
}

function recursiveFixMissingChildren(
  obj: Prisma.JsonValue
): [Prisma.JsonValue, boolean] {
  if (Array.isArray(obj)) {
    let replaced = false;
    const newObj = obj.map((o) => {
      const [newO, localReplaced] = recursiveFixMissingChildren(o);
      replaced ||= localReplaced;
      return newO;
    });
    return [newObj, replaced];
  } else if (obj && typeof obj === 'object') {
    if (obj.type === 'variable') {
      if (obj.children) {
        return [obj, false];
      } else {
        const newObj = { ...obj, children: [{ text: '' }] };
        return [newObj, true];
      }
    } else if (obj.children) {
      const newObj = { ...obj };
      const [newChildren, replaced] = recursiveFixMissingChildren(obj.children);
      newObj.children = newChildren;
      return [newObj, replaced];
    } else {
      return [obj, false];
    }
  } else {
    return [obj, false];
  }
}

function bulkUpdateTool(
  model: Tool,
  updatesInput: NexusGenInputs['BulkUpdateUpdatesInput']
): Partial<Tool> | null {
  const updates: Partial<Tool> = {};

  if (typeof updatesInput.isArchived === 'boolean' && !model.isArchived) {
    updates.isArchived = updatesInput.isArchived;
  }

  if (updatesInput.collectionId) {
    const [, collectionId] = decodeId(updatesInput.collectionId);
    if (collectionId !== model.collectionId) {
      updates.collectionId = collectionId;
    }
  }

  if (updatesInput.replace) {
    const config = updates.configuration ?? model.configuration;
    expectJsonObject(config);
    const replaceRegex = new RegExp(
      updatesInput.replace.map((r) => escapeRegExp(r.from)).join('|'),
      'g'
    );
    const replaceMap = Object.fromEntries(
      updatesInput.replace.map((r) => [r.from, r.to])
    );
    const [newConfig, replaced] = recursiveReplace(config, (orig: string) =>
      orig.replace(replaceRegex, (matched) => replaceMap[matched])
    );
    if (!newConfig) {
      throw new Error('Should never get null at top level');
    }
    if (replaced) {
      updates.configuration = newConfig;
    }
  }

  let recalculateInputs = false;
  if (updatesInput.removeIntro) {
    const matcher: (node: SlateNode) => boolean = (node) => {
      if (!isParagraph(node)) {
        return false;
      }
      const str = Node.string(node);
      return (
        node.children.every(
          (n) => n.type === 'variable' || typeof n.text === 'string'
        ) &&
        (str === '' || str.startsWith('Hi ') || str.startsWith('Hello '))
      );
    };

    const config = updates.configuration ?? model.configuration;
    expectJsonObject(config);
    const data = config.data;
    if (data) {
      if (!Element.isElement(data)) {
        throw new Error('Unexpected data blob format');
      }
      let modified = false;
      while (data.children.length > 0 && matcher(data.children[0])) {
        modified = true;
        data.children.shift();
      }
      if (modified) {
        recalculateInputs = true;
        updates.configuration = { ...config, data };
      }
    }
  }

  if (updatesInput.removeOutro) {
    const matcher: (node: SlateNode) => boolean = (node) => {
      if (!isParagraph(node)) {
        return false;
      }
      const str = Node.string(node);
      return (
        node.children.every(
          (n) => n.type === 'variable' || typeof n.text === 'string'
        ) &&
        (str === '' ||
          str.startsWith('Please let me know if ') ||
          str.startsWith("Please don't hesitate to ") ||
          str.startsWith('Best') ||
          str.startsWith('Thanks') ||
          str.startsWith('Thank you') ||
          str.startsWith('Cheers'))
      );
    };

    const config = updates.configuration ?? model.configuration;
    expectJsonObject(config);
    const data = config.data;
    if (data) {
      if (!Element.isElement(data)) {
        throw new Error('Unexpected data blob format');
      }
      let modified = false;
      while (
        data.children.length > 0 &&
        matcher(data.children[data.children.length - 1])
      ) {
        modified = true;
        data.children.pop();
      }
      if (modified) {
        recalculateInputs = true;
        updates.configuration = { ...config, data };
      }
    }
  }

  if (updatesInput.lineBreakRemoval) {
    const config = updates.configuration ?? model.configuration;
    expectJsonObject(config);
    const data = config.data;
    if (data) {
      if (!Element.isElement(data)) {
        throw new Error('Unexpected data blob format');
      }
      let modified = false;
      let newChildren = [];
      const isEmptyParagraph = (node: SlateNode) =>
        isParagraph(node) && Node.string(node) === '';
      if (updatesInput.lineBreakRemoval === 'intercomImportBug') {
        let skipNext = false;
        for (let i = 0; i < data.children.length; i++) {
          const node = data.children[i];
          if (skipNext) {
            skipNext = false;
            if (isEmptyParagraph(node)) {
              modified = true;
            } else {
              newChildren.push(node);
            }
          } else if (isParagraph(node)) {
            skipNext = true;
            newChildren.push(node);
          } else {
            newChildren.push(node);
          }
        }
      } else if (updatesInput.lineBreakRemoval === 'moreThanOne') {
        for (let i = 0; i < data.children.length; i++) {
          const node = data.children[i];
          if (
            i > 0 &&
            isEmptyParagraph(node) &&
            isEmptyParagraph(data.children[i - 1])
          ) {
            modified = true;
          } else {
            newChildren.push(node);
          }
        }
      } else {
        throw new Error('Invalid lineBreakRemoval value');
      }

      if (modified) {
        console.log(newChildren);
        updates.configuration = {
          ...config,
          data: { ...data, children: newChildren },
        };
      }
    }
  }

  if (recalculateInputs) {
    const config = updates.configuration ?? model.configuration;
    expectJsonObject(config);
    const inputs = updates.inputs ?? model.inputs;
    expectJsonArray(inputs);
    if (!Element.isElement(config.data)) {
      throw new Error('Expected config to have a data blob');
    }
    const variables = extractVariablesFromSlate(config.data.children);
    const newInputs: Prisma.JsonValue[] = [];
    inputs.forEach((v) => {
      expectJsonObject(v);
      if (variables.find((i) => i.source === v.source && i.id === v.id)) {
        newInputs.push(v);
      }
    });
    updates.inputs = newInputs;
  }

  if (updatesInput.fixMissingChildren) {
    const config = updates.configuration ?? model.configuration;
    expectJsonObject(config);
    if (config.data) {
      const [data, replaced] = recursiveFixMissingChildren(config.data);
      if (!data) {
        throw new Error('Should never get null at top level');
      }
      if (!Element.isElement(data)) {
        throw new Error('Should be fixed');
      }
      if (replaced) {
        updates.configuration = { ...config, data };
      }
    } else if (Array.isArray(config.urls)) {
      let replaced = false;
      const newUrls = config.urls.map((url) => {
        const [newUrl, singleReplaced] = recursiveFixMissingChildren(url);
        replaced ||= singleReplaced;
        return newUrl;
      });
      if (replaced) {
        updates.configuration = {
          ...config,
          urls: newUrls,
        };
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    return updates;
  } else {
    return null;
  }
}
