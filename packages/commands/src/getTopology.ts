import {
  ExtensionMessagingStrategy,
  Topology,
  WindowMessagingStrategy,
} from '@michaelschade/kenchi-message-router';

export function getTopology(appOrigin: string, extensionId: string): Topology {
  return {
    secureOrigins: new Set([appOrigin, `chrome-extension://${extensionId}`]),
    edges: {
      hostedBackground: {
        background: {
          strategy: WindowMessagingStrategy,
          secure: true,
        },
      },
      background: {
        hostedBackground: {
          strategy: WindowMessagingStrategy,
          secure: true,
          waitForReady: true,
        },
        contentScript: {
          strategy: ExtensionMessagingStrategy,
          secure: true,
        },
        iframe: {
          strategy: ExtensionMessagingStrategy,
          secure: true,
        },
      },
      contentScript: {
        background: {
          strategy: ExtensionMessagingStrategy,
          secure: true,
        },
        pageScript: {
          strategy: WindowMessagingStrategy,
          secure: false,
          waitForReady: true,
        },
        hud: {
          strategy: WindowMessagingStrategy,
          // This is only insecure because the HUD's reply to the contentScript
          // has to go through window.top.postMessage. The actual messages from
          // contentScript to HUD are secure. If we could somehow declare this a
          // one-way edge it could be secure (we could even still route
          // responses through another path, e.g. via background), but the
          // message-router architecture only supports bidirectional edges.
          secure: false,
          waitForReady: true,
        },
      },
      pageScript: {
        contentScript: {
          strategy: WindowMessagingStrategy,
          secure: false,
        },
      },
      iframe: {
        contentScript: {
          strategy: ExtensionMessagingStrategy,
          secure: true,
        },
        background: {
          strategy: ExtensionMessagingStrategy,
          secure: true,
        },
        app: {
          strategy: WindowMessagingStrategy,
          secure: true,
          waitForReady: true,
        },
      },
      dashboard: {
        background: {
          strategy: ExtensionMessagingStrategy,
          secure: true,
        },
      },
      app: {
        iframe: {
          strategy: WindowMessagingStrategy,
          secure: true,
        },
      },
      hud: {
        background: {
          strategy: ExtensionMessagingStrategy,
          secure: true,
        },
      },
    },
  };
}
