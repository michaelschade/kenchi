#!/usr/local/bin/npx ts-node
import dotenv from 'dotenv';
import { PrismaClient } from 'prisma-client';
import yargs from 'yargs';

dotenv.config();

export async function main(db: PrismaClient, orgId: number) {
  const workflows = await db.workflow.findMany({
    where: {
      organizationId: orgId,
      branchType: 'published',
      isLatest: true,
      isArchived: false,
      type: 'workflow',
    },
  });
  console.log(JSON.stringify(workflows));
}

if (require.main === module) {
  const argv = yargs
    .command('extract_item', 'dump workflows or tools')
    .option('org_id', {
      alias: 'o',
      type: 'number',
      required: true,
      description: 'The ID of an organization to dump from',
    }).argv;

  main(new PrismaClient(), argv.org_id);
}
