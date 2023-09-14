# Making API Changes

Working on a project that requires changing the shape of some data in the API? Here's what to do, backend-to-front:

## 1. Create a database migration

1. Copy the latest database migration from `packages/backend/migrations`.
2. Update the start of the filename to the current date, and the end of the filename to something reasonably meaningful to describe your change. Keep the zeroes.
3. Write up the migration accordingly. See [the docs on defining migrations with `node-pg-migrate`](https://salsita.github.io/node-pg-migrate/#/migrations).

## 2. Run the migration

---

Note: Though we use Prisma, we do _not_ currently use [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate).

---

```sh
cd packages/backend
pnpm migrate up
```

Then you can check Postico to verify that the database structure was updated as you expect. Open the table in question in Postico, then click the Structure button on the bottom left.

## 3. Update `schema.primsa`

[`schema.prisma`](https://www.prisma.io/docs/concepts/components/prisma-schema) defines the database schema. Add/modify the model in question there to reflect the new desired structure.

---

Note: If you're adding a string field, our convention is to make it be a _required_ field, defaulting to `''`.

---

## 4. Run `pnpm generate` on the backend

```sh
cd packages/backend
pnpm generate
```

## 5. Update the GraphQL API definition for the model on the backend

If you're working with Collections for example, the file you want is `packages/backend/api/graphql/Collection.ts`. See [the Nexus Prisma plugin documentation](https://nexusjs.org/docs/plugins/prisma/overview) for instructions on how to define the API.

## 6. Update the GraphQL queries (those against the API in the previous step) on the frontend

These are likely (but not necessarily) in `packages/frontend/src/graphql/fragments.ts`.

### ⚠️ Potentially dangerous thing ⚠️

If a backend field is required input for a mutation, but a request from the frontend does not include it, that would be bad. This could happen if you deploy the backend change that makes a field required while clients are still running the frontend code that submits data without the required field.

### Solution to said dangerous thing

Make the change in three steps:

1. Introduce the new backend field as an _optional_ field. Deploy that.
2. Deploy the frontend that submits data including the new field.
3. A day or so later, when you can be quite confident all clients have the new frontend code, make the backend field required. Deploy the backend again.

## 7. Generate the types for those queries on the frontend

```sh
cd packages/frontend
pnpm generate
```

## 8. Commit the results

The `pnpm generate` commands you ran in earlier steps generated a few files that need to be checked in. Make sure you add those, not just the files you changed directly.
