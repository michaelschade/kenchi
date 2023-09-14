import { Prisma, Space, Tool, Widget, Workflow } from 'prisma-client';

import { expectJsonArray, expectJsonObject } from './utils';
import { generateModel } from './versionedNode';

export const SpaceModel = generateModel<
  Omit<Prisma.SpaceFindManyArgs, 'select' | 'include'>,
  Omit<Prisma.SpaceFindFirstArgs, 'select' | 'include'>,
  Prisma.SpaceUncheckedCreateInput,
  Space
>(
  'spce',
  'sbrch',
  'srev',
  ({ widgets, ...rest }) => {
    expectJsonArray(widgets);
    return { widgets, ...rest };
  },
  (ctx) => ctx.db.space
);

export const ToolModel = generateModel<
  Omit<Prisma.ToolFindManyArgs, 'select' | 'include'>,
  Omit<Prisma.ToolFindFirstArgs, 'select' | 'include'>,
  Prisma.ToolUncheckedCreateInput,
  Tool
>(
  'tool',
  'tbrch',
  'trev',
  ({ configuration, inputs, ...rest }) => {
    expectJsonObject(configuration);
    expectJsonArray(inputs);
    return { configuration, inputs, ...rest };
  },
  (ctx) => ctx.db.tool
);

export const WidgetModel = generateModel<
  Omit<Prisma.WidgetFindManyArgs, 'select' | 'include'>,
  Omit<Prisma.WidgetFindFirstArgs, 'select' | 'include'>,
  Prisma.WidgetUncheckedCreateInput,
  Widget
>(
  'wdgt',
  'wgtbrch',
  'wgtref',
  ({ contents, inputs, ...rest }) => {
    expectJsonArray(contents);
    expectJsonArray(inputs);
    return { contents, inputs, ...rest };
  },
  (ctx) => ctx.db.widget
);

export const WorkflowModel = generateModel<
  Omit<Prisma.WorkflowFindManyArgs, 'select' | 'include'>,
  Omit<Prisma.WorkflowFindFirstArgs, 'select' | 'include'>,
  Prisma.WorkflowUncheckedCreateInput,
  Workflow
>(
  'wrkf',
  'wbrch',
  'wref',
  ({ contents, ...rest }) => {
    expectJsonArray(contents);
    return { contents, ...rest };
  },
  (ctx) => ctx.db.workflow
);
