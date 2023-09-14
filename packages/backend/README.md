# Local development

After initial setup (see top-level README), run:

    pnpm start

If you have trouble, sorry! See the Troubleshooting section below and just quickly ask for help so we can unblock you.

VSCode should tightly integrate Typescript errors into your code, but if you miss any `pnpm start` doesn't alert you to them. In a separate window/panel, you can run `pnpm tsc` to typecheck your code and make sure you don't miss anything.

## Getting production data into local

We aspire to avoid using production data locally. For now, this is a necessity in our development environment, and means taking _extra_ care of the [security of your laptop](https://docs.google.com/document/d/1uJNuvP0oyJN8dQ-YYVe3NzLWhYiIDRt0SkR-nLlHTMM/edit).

With that said, to import data:

1. Download a recent [production snapshot from render](https://dashboard.render.com/d/dpg-bq1dg734tttnbqkvbrag) (format .sql.gz).
2. Connect to your local Postgres in your terminal. The password is in your local `.env`:

       psql -h localhost -U kenchi -W kenchi

3. In the Postgres shell, drop any existing schemas and dbs and recreate:

       drop schema public cascade; create schema public; grant all on schema public to kenchi; grant all on schema public to public;

4. Do some munging on the data:

       ~/KENCHI_REPO_DIR/packages/backend/dev/convert_prod_backup_to_dev.ts SQL_SNAPSHOT.sql.gz

5. That should take around 5m to run, and will output the next command of the form:

       psql -h localhost -U kenchi -W kenchi < kenchi.clean.sql

6. Don't forget to delete the SQL file when you're done so it's not sitting around!

       rm SQL_SNAPSHOT.sql.gz

That should be it!

# Generated code

* If you change `prisma/schema.prisma` you need to regenerate its types via `pnpm generate:prisma`
* If you change our GQL schema (e.g. adding or removing a property or changing a property's signature) `api.graphql` and underlying types should auto-generate when the server restarts. Alteratively you can run `pnpm generate:nexus`, but it shouldn't be necessary

# Kenchi architecture

For an overview of our Architecture, see the diagrams in `docs/`.

# Quick reference links

* [`pgm` -- node-pg-migrate](https://salsita.github.io/node-pg-migrate/#/migrations): documentation for functions like `createTable`, `dropTable`, `createIndex`, etc.
* [Prisma](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/crud): documentation for `db.findUnique`, `findMany`, `create`, `update`, `delete`, etc. You'll also find all other ORM-related docs here, such as pagination, aggregation, etc.
* [Nexus](https://nexusjs.org/) documents our GraphQL schema types.
* [Apollo Server](https://www.apollographql.com/docs/apollo-server/) documents our GraphQL handling server.

# Data: our database, schema, and GraphQL

## Terminology overview

Backend is a Node-based set of code responsible for defining our database schema, API and GraphQL endpoints, and the logic by which we authenticate, create/update, and kick off asynchronous queue-based processes.

In a nutshell, Prisma gets us from the database to node, Nexus schema from node to a GraphQL API, and Apollo Server/Express serves everything. From there, Frontend is responsible for writing its GraphQL queries and talking to Backend (see `frontend/README.md`).

* **Prisma**: Prisma is the glue between PostgreSQL (our database) and this Node environment. Prisma allows us to declaratively define our schema and is responsible for ensuring the latest schema is in sync with the underlying PostgreSQL database schema.
    * Example file: [Prisma schema](./prisma/schema.prisma) is the source of truth for our database schema

* **Nexus Schema**: Nexus Schema is the glue between Prisma and the GraphQL endpoints we expose to our endpoints. Schema knows how to translate an object in the Prisma schema (which is usually 1:1 with a Database table) to a GraphQL object that the Frontend consumes (which is _usually_ 1:1 with the underlying object, but may not always be -- hence the extra layer). This layer is also how we generate TypeScript types for GraphQL endpoints to make development safer.
    * Example file: [Workflow GraphQL object](./api/graphql/Workflow.ts) is an example of one of our more intricate GraphQL object types. This file contains our basic GraphQL schema (what the Frontend accesses to display data about Workflows) as well as the mutations that allow the Frontend to create, update, or delete Workflows. You'll find a ~1:1 mapping with the Prisma schema in the containing directory.

* **Queue Worker**: Worker, which lives out of `api/queue`, is our Queue-service (running off of the npm Bull) package that uses Redis to manage asynchronous jobs. This helps us process logs as well as more expensive, write-heavy tasks such as denormalizing Tools contained within Workflows.

## Prisma (our database schema)

* See [Prisma schema](./prisma/schema.prisma) for the latest representation of our database schema
* The Prisma schema defines all of our database columns, indexes, foreign keys, etc. When you modify this file, Nexus will notice the change, ask if you need to regenerate types, and so on.
* **Partial indexes**: Note that Prisma does not have good support for partial indexes, which [bkrausz has a bug report open about](https://github.com/prisma/prisma/issues/3076). Partial indexes are a handy PostgreSQL functionality that allow you to e.g. specify a unique constraint on Workflow for `[static id, is latest]`, ensuring there is only one latest Workflow at any point. Since Prisma doesn't support this, its schema generation can be off from our underlying database. This is only relevant for migrations--see below.

### Database Migrations

We use [node-pg-migrate](https://salsita.github.io/node-pg-migrate/) as a basic migration framework. To catch up on migrations run `pnpm migrate up`.

For new migrations:
1. **Define the migration**: to make a new migration named "my changes" run `pnpm migrate create my changes`.
    * This will make a file with a needlessly long timestamp. Please change any digits after the date to `0` (you must preserve the length).
    * Update this file to describe your migration. See https://salsita.github.io/node-pg-migrate/ for the DSL for table changes.
2. **Run the migration**: `pnpm migrate up`
3. **Update the schema**: update [schema.prisma](./prisma/schema.prisma) to reflect the new schema
    * Running `pnpm prisma introspect --experimental-reintrospection` will automatically update it based on the current state of Postgres
    * However, as stated Prisma does a few things wrong:
        * It will incorrectly assume partial indexes aren't partial, adding `@unique` where it doesn't belong
        * As a result it will assume some relationships are 1:1 when they're actually 1:many
        * It also doesn't preserve `@updatedAt` (see https://github.com/prisma/prisma/issues/2829)
    * The easiest thing to do right now is run the introspection, pull out the part that's relevant to your change, revert the file, and reapply your change. If your change is simple you can also manually change your schema, but please be sure it accurately reflects the state of the database.
        * This should become unnecessary once https://github.com/prisma/prisma/issues/2829 lands, if that takes a while we should write a schema differ that ignores known discrepancies.
4. **Update Prisma TypeScript definitions**: Run `pnpm generate:prisma`. These are TypeScript definitions around ctx.db.TABLENAME and such.
5. (Likely unnecessary) If for some reason the backend server didn't run this on restart, you may also want to run `pnpm generate:nexus`.  These are TypeScript definitions for `nexus-prisma` imports and all other GraphQL stuff.

If you're working in dev and get an error about the order of migrations (e.g.
`Error: Not run migration 20201008000000000_shortcuts is preceding already run
migration 20201022000000000_user-workflow-view-counts`), you can override this
with `pnpm run migrate up -- --no-check-order`.

### Queries

In GraphQL-land the db is accessed via `ctx.db`. Outside of it there will probably be a global `db` param available (e.g. in `endpoints.ts`).

#### Reading

* [Example](https://github.com/kenchi/kenchi/blob/4e96642d64c79c8f691d096ee028573e76d48002/tsbackend/api/graphql/Workflow.ts#L43-L48)
* Prisma exposes a MongoDB-like query DSL for PostgreSQL queries. Take a look at `db.*`; e.g. `db.findUnique` and `db.findMany`.
* `findUnique` strictly requires the query can only return one result, which doesn't always work for our purposes (particularly the combo of `[static id, is latest]` queries) -- we may introduce a `findByStaticID` helper or similar, but for now plan to use `findMany` and select accordingly.
* **Joins**: Prisma will traverse joins for you! Where in SQL you might say `JOIN organizations on id=3`, in Prisma you can just say `{ where { organization: { id: 3 } } }`. The `organization` sub-object knows it's talking about an organization, so you can pass in any field; for example: `{ where { organization: { name: "kenchi.com" } } }` and it'll :magic: it all for you.
* **Use `$queryRaw` with caution**: $queryRaw will not automatically map the resulting table and column names from the database to our schema because our database uses snake case names, whereas Prisma prefers and only maps CamelCase names. When we use `$queryRaw`, we'll often feed the resulting IDs into a proper query in order to get Prisma to do the work for us; otherwise, you'll need to name each column as the CamelCase variation with SQL `AS` to help Prisma map.

#### Creating/Updating

Creation is pretty standard in Prisma if you know how to query. That said:

* `connect`: For creating, you specify relations similar to how you specify Joins (see last section), this time using the `connect` declaration. For example, if you're creating a user as part of organization 3, you'd include: `{ organization: { connect: { id: X } } }`. Again, you can include any sub-object that the Prisma ORM can use to find the correct organization--neat!
  * You don't *have* to use this, you can instead do `userId: X`, which is usually much cleaner.
* `connectOrCreate`: Since Prisma doesn't have great support for transactions (more below), `connectOrCreate` is its version of an upsert. Based on the sub-object, it'll tie the relationship to an existing object or create it for you.

#### Transactions

Prisma and Nexus together unfortunately don't have great support for transactions. Prisma does let you specify an array of requests to `prisma.$transaction`, but this has to be the reduced lists of requests, meaning you can't have a standard transaction block where you create a new object, reference the resulting object, and update something else accordingly, and roll it all back if any of those steps fails.

The limited support that exists is through `db.$transaction`; see [Workflow.ts](./api/graphql/Workflow.ts) for an example of this in practice.

## Nexus Schema (our GraphQL endpoints)

* Nexus Schema describes each GraphQL object and mutations. It has a lot of convenience helpers for automatically binding to the underlying Prisma schema in order to tie the data through.
* We organize all these in `api/graphql`; see [Workflow.ts](./api/graphql/Workflow.ts) as a good example.

### Quick intro on the APIs

* `objectType(name)` — if `name` matches the name of a model, it'll automatically wire it together with the underlying Prisma model. That passes in `t` which is the object type definition.
  * `sourceType`: These GraphQL objects are _usually_ 1:1 with the underlying database object, but not always. For example, in [User.ts](./api/graphql/User.ts), we introduce `LimitedUser`, which is just a subset of the `User` object. Use the `sourceType` field to tell it to reference the correct object (e.g. `PrismaUser`).
* `import { ModelName as Fields } from 'nexus-prisma';` + `t.field(Fields.fieldName)` is a simple way to expose the underlying field
* `t.field(name, { type: ..., resolve: ... })`: sometimes we need to introduce custom fields (either by name or by return value). A field has a `resolve` function, which defines how how to determine the object value. `resolve` takes three arguments:
  * `root` is the underlying thing rendering the object (so for Workflow fields, `root` is the Workflow object)
  * `args` is any input into rendering the field
  * `context` is the everything Nexus feeds up from `app.ts` including our Kenchi plugins to (see below); specifically, this will include the Prisma `db` instance as well as `session` for authentication

### Security (Shield)

One risk with GraphQL is accidentally exposing privilege escalation through graph traversal. For example, User has a *lot* of things you can view off of it, including that user's private drafts. If someone were to get to that user (say, if we exposed a User through a Workflow's createdBy field), it'd be a permissions collapse.

While we should aim to ensure that it's not possible to traverse to objects outside your permissions boundary (which is why we expose LimitedUser on a Workflow's createdBy field, not User), we use [GraphQL Shield](https://github.com/lvauvillier/nexus-plugin-shield#nexus-plugin-shield) as a last-chance check that will error out the request. Check out [shield.ts](./api/shield.ts) for how rules are defined: you only need to care if you're adding a new object or exposing access to an object in a new way.

### GraphQL Schema Changes
* See `frontend/README.md` for what to do on the frontend once backend has generated the new schema and type definitions.

## Server

* `pnpm start` starts Express (and all of the above) in development mode, including watching files
* `pnpm tsc` starts a typescript checker, which will watch files and warn you if you have any TS errors that would stop the backend from working in prod
* [app.ts](./api/app.ts) initializes our environment, including configuring our server.
* [endpoints.ts](./api/endpoints.ts) defines all the other random endpoints we have such as `/q` for logs. There's nothing special about this file as it's just imported via `app.ts`.
* **Debugging**: To debug the server using Node debugger, run `pnpm start:inspect`. We start the Worker debugger on `localhost:9229`. See the Debugging section below for more info on how to use this.
  * **VSCode**: If you're using VS Code, instead of `pnpm start`, you can click _Run -> Start Debugging_ for in-app debugging. Neat! Check out the [Nexus debugging docs](https://nexusjs.org/guides/recipes#debugging) for more info.
  * Since `nexus` seemingly only passes through `--inspect-brk` argument to get into inspect mode, which will breakpoint on every server initialization (including restarts), recommend only using `dev:inspect` when you actually need to debug.

## Queue Worker

* `pnpm start:worker` starts the queue worker in development mode. This will watch `api/queue/worker.ts` and restart whenever that file (or any required files) change.
* **Debugging**: For tips on debugging the worker using Node debugger, see the Debugging section below. We start the Worker debugger on `localhost:9239`; this is a non-standard port, so you may need to add it to your Chrome or VS Code inspector.

## Debugging

* When you're in [node debug mode](https://nodejs.org/en/docs/guides/debugging-getting-started/), you can attach a debugger (either via VSCode or using something like [chrome://inspect](chrome://inspect)) and inspect the worker state.
  * If you add in `debugger;` into your code, your debugger will automatically attach a breakpoint. This makes it easy to inspect state at that breakpoint.
  * In the Chrome debugger, press Cmd+P and search for `worker.ts` (or other files) to open up the source, inspect state, and set breakpoints interactively.
  * Take a look at the [node debugger API reference](https://nodejs.org/api/debugger.html) for other tips and tricks.
  * **Restarting & debugger**: Note that if the debugger is attached, `dev:worker` can't restart until it's closed.

## Troubleshooting

* Add troubleshooting tips here as you run into them plzkthx!
