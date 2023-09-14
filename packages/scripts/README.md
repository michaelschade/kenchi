These are scripts that get injected into the page via a `<script>` tag so they have access to on-page Javascript objects. They communicate back to the rest of Kenchi via `message-router`.

To add a new injected script, just make a directory with an index.js, which is then built and can be added to a page via `utils.injectScript(dir_name)` in the extension or `messageRouter.sendCommand('contentScript', 'injectScript', { name });` in the app. You'll need to restart `pnpm start` so that webpack picks it up.

Under the hood in dev, we build and serve these via webpack.config.js at localhost:4000/js/{name}.bundle.js. This gets served from scripts.kenchi.dev via the nginx proxy locally.
