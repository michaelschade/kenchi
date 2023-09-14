import type { FileUpload } from 'graphql-upload';
import type Prisma from 'prisma-client';

// One of these must match the exact name of the object in order for Nexus to
// import this file...some RegExp matching bug :(. I choose Upload!
export type Upload = Promise<FileUpload>;
export type PrismaVersionedNode =
  | Prisma.Workflow
  | Prisma.Tool
  | Prisma.Space
  | Prisma.Widget;

// There are some different behaviors for versioned nodes that belong to a
// collection checking, and merging mechanisms as the other versioned node
// models
export type PrismaVersionedNodeWithoutCollection = Exclude<
  PrismaVersionedNode,
  Prisma.Space | Prisma.Widget
>;
