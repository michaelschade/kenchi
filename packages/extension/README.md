
## Available Scripts

In the project directory, you can run:

### `pnpm start`

Runs the app in the development mode.<br />
Creates a `build-${ENV}/` directory that can be loaded as a chrome extension

The extension will automatically rebuild if you make edits, but you need to reload the extension for them to take effect. Installing [Extensions Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid) will make your life a lot easier.

### `pnpm build`

Similar to `pnpm start` but builds the application once instead of watching for changes.

## Topology

We have 6 different window contexts that need to communicate with each other. The goal here is to push as much logic into hosted code so we're less beholden to the Chrome web store update cycle.

```
hosted background iframe
^/v
extension background
^/v
extension contentScript <-> hosted injectedScript (optional)
^/v
extension iframe
^/v
hosted app iframe
```

* Hosted background iframe - manages open/close state, passes that to the contentScript so it knows whether or not it should open.
* Extension background - message passing to the hosted background iframe and listening for the Kenchi button click
* Extension contentScript - MAKE SMALLER
* Extension iframe - bridge between the contentScript and the hosted app. We could eliminate this, but then if you reloaded the hosted app iframe (as happens in dev) we'd get a CSP error. If it's inside of the extension iframe CSP just works.
* Hosted app iframe - the app!
