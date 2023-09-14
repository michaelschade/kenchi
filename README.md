> [!NOTE]
> [Kenchi](https://kenchi.com/) was a privacy-first Chrome extension originally created to supercharge support tools, and built to be a generic sidebar for the internet. We unfortunately shut down in late 2022, but thought our app had enough novel technical approaches that made it worth open sourcing—so here we are! Kenchi is now available under the MIT license. You'll find here an extension built to work reliably on any third-party site, chock-full of convenience features like a robust [message passing library](https://github.com/michaelschade/kenchi-message-router) built with extensions in mind, keyboard shortcuts, local caching, a GraphQL-driven webapp, robust reporting engine, fine-grained permissions, GitHub-style PRs for support content, a custom document editor, and much more.
>
> If you're looking to build your own support tools in house, or looking for inspiration from a battle tested Chrome extension, we hope you find this code heplful. Shared with 💜 by co-founders [Brian Krausz](https://twitter.com/bkrausz) and [Michael Schade](https://twitter.com/sch), and previous team members [Dave Cole](https://twitter.com/mrdavidjcole), [Katie Talwar](https://twitter.com/katie_talwar), [Kevin Ingersoll](https://twitter.com/kingersoll), and [Pantera Arzhintar](https://twitter.com/elbbirt). If you have any issues, reach out to Brian or Michael and we'll do our best to help.

# Kenchi monorepo README

> [!IMPORTANT]
> Since this was a commercial application, we had a number of licenses and custom IDs in use you'll need to update if you want to stand up the app in full:
>
> **Fonts**: If you'd like the site to look the same as our [production site](https://kenchi.com/), you'll need to purchase a license to the delightful [Neue Machina font](https://pangrampangram.com/products/neue-machina) by Pangram Pangram Foundry. Place these files in `packages/site/src/fonts/`: `PPNeueMachina-Light.woff`, `PPNeueMachina-Light.woff2`, `PPNeueMachina-Regular.woff`, and `PPNeueMachina-Regular.woff2`
>
> **Icons**: For FontAwesome Pro icons, [add your FontAwesome auth token to your .npmrc](https://fontawesome.com/docs/web/setup/packages)
>
> **env files**: We make references to our published Chrome IDs, Sentry DSN, and other unique IDs in various .env files. Update the various .env files (`find packages -name ".env*"`) with your own IDs.

## First time setup

* Install and start [Docker Desktop](https://www.docker.com/products/docker-desktop)
* Install [Homebrew](https://brew.sh/)
* `brew install node@16 pnpm tmux overmind postgres`
  * If your laptop has node install already you'll have the wrong version in your PATH. `brew` will display a message indicating this.
  * To check, run `node --version` and see if it's 16.
  * If it's not, run `export PATH="/opt/homebrew/opt/node@16/bin:$PATH"' >> ~/.zshrc` followed by `. ~/.zshrc` and try again.
* Set up git
  * Add your `@kenchi.com` email address [to your GitHub account](https://github.com/settings/emails)
  * [Set up SSH key](https://docs.github.com/en/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) and [add it to your GitHub account](https://docs.github.com/en/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account)
  * `git config --global user.name "Your Name"`
  * `git config --global user.email "you@kenchi.com"`
* Clone this repo via `git clone git@github.com:kenchi/kenchi.git`
* Go to [https://github.com/settings/tokens](https://github.com/settings/tokens) and create a personal access token with `repo` and `read:packages` permissions. No expiration is fine.
  * `npm config set "//npm.fontawesome.com/:_authToken" 264E9B96-1535-4EEB-B97E-F7E324F74805`
  * `npm login --registry=https://npm.pkg.github.com`
  * Enter your Github username, the access token you just made as the password, and your @kenchi.com email.
* `cp packages/backend/sample.env packages/backend/.env`
* `pnpm install`
* `./packages/backend/dev/init_env` (follow the instructions to install mkcert and update /etc/hosts)
* `pnpm -C packages/backend migrate up`

## Check out these READMEs

* `packages/backend/README.md`
* `packages/frontend/README.md`

## Running Kenchi

* `pnpm start:app` is the place to start, it'll run everything you need to work on Kenchi the application.
* `pnpm start` will also run admin and Kenchi website.

## Exploring the API

In dev, you can access the GraphQL playground at [https://api.kenchi.dev/playground](https://api.kenchi.dev/playground). Query to your heart's content! Try this for example:

  ```gql
  {
    viewer {
      user {
        id
      }
    }
  }
  ```

## Making API changes

See this doc: `docs/making-api-changes.md`

## Deploying

### Production

1. Merge your PR
2. Make sure the tests pass on `main`. Head to [https://github.com/kenchi/kenchi/commits/main](https://github.com/kenchi/kenchi/commits/main) and wait for that green check mark next to your commit. ✅
3. Pull the latest `main`.
4. Push to the prod branch for the service you wish to deploy. You can see the full list of prod branches at [https://github.com/kenchi/kenchi/branches/all?query=prod](https://github.com/kenchi/kenchi/branches/all?query=prod). For the frontend for example, do

  ```sh
  git push origin main:prod-frontend
  ```

From there, Render will take over and deliver your code to our customers. You can observe the deploy process in [the Render dashboard](https://dashboard.render.com/).

A cautionary note: Render will gladly deploy a broken branch! If things somehow go south, fear not. You can [rollback to an earlier, happy deploy in Render](https://render.com/docs/rollbacks).

### Staging

To deploy your branch to staging, simply push your branch (ex: `my-nifty-branch`) to the `staging` branch on origin like so:

```sh
git push origin my-nifty-branch:staging
```
