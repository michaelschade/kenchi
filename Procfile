# Run dev services with Overmind
#
# Prerequisites:
#   brew install overmind
#
# Usage:
#   pnpm start
#
frontend: cd packages/frontend && FORCE_COLOR=true pnpm start | cat
backend: cd packages/backend && pnpm start
worker: cd packages/backend && pnpm start:worker
extension: cd packages/extension && pnpm start
scripts: cd packages/scripts && pnpm start
shared: cd packages/shared && pnpm start
slate_tools: cd packages/slate-tools && pnpm start
ui: cd packages/ui && pnpm start
commands: cd packages/commands && pnpm start
admin_frontend: cd packages/admin && FORCE_COLOR=true pnpm start | cat
admin_backend: cd packages/backend && pnpm start:admin
site: cd packages/site && pnpm start
