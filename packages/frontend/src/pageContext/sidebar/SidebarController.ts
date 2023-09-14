import { History } from 'history';

import { Commands, KenchiMessageRouter } from '@kenchi/commands';
import { PageColors } from '@kenchi/ui/lib/Colors';

import { isExtension } from '../../utils';
import { trackEvent, trackTelemetry } from '../../utils/analytics';
import { State } from '../../utils/history';
import { DomainSettings } from '../domainSettings/DomainSettingsController';

const GMAIL_HOST = 'mail.google.com';

export default class SidebarController {
  private url: URL | null = null;
  private open: boolean;
  private changingOpen: boolean = false;

  private domainSettings: DomainSettings | null = null;

  private timingStart: number | null = null;
  private timingFrom: string | null = null;

  constructor(
    private messageRouter: KenchiMessageRouter<'app'>,
    private history: History<State>
  ) {
    // If we reloaded the page from a click or login, we're actually still open
    this.open = isExtension() && history.location.pathname !== '/empty';
  }

  register() {
    const unregisterMethods: (() => void)[] = [];

    const registerOne: typeof this.messageRouter.addCommandHandler = (
      origin,
      command,
      handler
    ) => {
      this.messageRouter.addCommandHandler(origin, command, handler);
      unregisterMethods.push(() =>
        this.messageRouter.removeCommandHandler(origin, command, handler)
      );
    };

    registerOne('background', 'togglePressed', ({ start }) => {
      if (start) {
        this.timingFrom = 'timingPressed';
        this.timingStart = start;
      }
      trackEvent({
        category: 'shortcuts',
        action: 'toggle_button',
        label: 'Kenchi button pressed',
      });
      return this.toggleKenchi();
    });

    registerOne('background', 'activatePressed', ({ start }) => {
      if (start) {
        this.timingFrom = 'activatePressed';
        this.timingStart = start;
      }
      trackEvent({
        category: 'shortcuts',
        action: 'activate_key',
        label: 'Activate keyboard shortcut pressed',
      });
      return this.activateKenchi();
    });

    registerOne('background', 'hidePressed', () => {
      trackEvent({
        category: 'shortcuts',
        action: 'hide_key',
        label: 'Hide keyboard shortcut pressed',
      });
      return this.hideKenchi();
    });

    registerOne('contentScript', 'proposeNewSnippet', (args) =>
      this.proposeNewSnippet(args)
    );

    const listeners: Record<string, () => void> = {};
    if (isExtension()) {
      listeners.focus = () => this.applyStyles();
      listeners.blur = () => this.applyStyles();
    }

    Object.entries(listeners).forEach(([event, callback]) => {
      window.addEventListener(event, callback);
    });

    return () => {
      Object.entries(listeners).forEach(([event, callback]) => {
        window.removeEventListener(event, callback);
      });
      unregisterMethods.forEach((c) => c());
    };
  }

  setPageUrl(url: URL) {
    this.url = url;
  }

  private async proposeNewSnippet(
    args: Commands['app']['proposeNewSnippet']['args']
  ) {
    this.activateKenchi();
    this.moveOffEmptyURL();
    this.history.push('/snippets/new', { proposedSnippet: args });
  }

  private async applyStyles(setStyle?: string) {
    const sideClass = `kenchi-${this.getCurrentSide()}`;
    const bodyClasses = [sideClass];
    const iframeClasses = [sideClass];
    if (document.hasFocus()) {
      iframeClasses.push('kenchi-active');
    }
    if (this.open) {
      bodyClasses.push('kenchi-open');
      iframeClasses.push('kenchi-open');
    }
    return this.messageRouter.sendCommand('contentScript', 'applyStyles', {
      setBodyClasses: bodyClasses,
      setIframeClasses: iframeClasses,
      setStyle,
    });
  }

  private getCurrentSide() {
    let side = this.domainSettings?.side || 'left';
    const validSides = ['left', 'right'].concat(
      Object.keys(this.domainSettings?.customPlacements || {})
    );
    if (!validSides.includes(side)) {
      side = 'left';
    }
    return side;
  }

  private async initializeUI() {
    const settings = this.domainSettings;
    if (!settings) {
      throw new Error('Initialize must be called after domainSettings is set');
    }
    if (this.url?.host === GMAIL_HOST) {
      this.moveOffEmptyURL();
    } else {
      const style = `
        #kenchi-iframe {
          display: none;
          position: fixed;
          top: 0;
          height: 100vh;
          width: 300px;
          z-index: 99999;
          // TODO: figure out how to get color from theme here. Not sure how to
          // do it outside of React at the moment.
          background: ${PageColors.extensionBackground};
          border: 0;
          box-shadow:
            0 0 1px 0 rgba(0, 0, 0, .3),
            0 0 20px -5px rgba(0, 0, 0, 0.2);
          transition: all 0.15s ease-in-out;
        }

        #kenchi-iframe.kenchi-active {
          box-shadow:
            0 0 1px 0 rgba(0, 0, 0, .3),
            0 0 30px 0 rgba(0, 0, 0, 0.3);
        }

        #kenchi-iframe.kenchi-left {
          left: 0;
        }
        #kenchi-iframe.kenchi-right {
          right: 0;
        }
        #kenchi-iframe.kenchi-open {
          display: block;
        }

        ${Object.values(settings?.customPlacements || {})
          .map((p) => p.style)
          .join('\n\n')}
      `;
      await this.applyStyles(style);
      this.moveOffEmptyURL();
    }

    if (settings.open === true && !this.open) {
      this.toggleKenchi(false);
    }
  }

  async applyUpdatedSettings(prevSettings: DomainSettings) {
    if (this.domainSettings && prevSettings.side !== this.domainSettings.side) {
      await this.applyStyles();
    }
  }

  // This should really not exist, GmailAction should tie into
  // DomainSettingsController to get the settings it needs. But being lazy for
  // now...
  getDomainSettings() {
    return this.domainSettings;
  }

  onDomainSettingsUpdate(domainSettings: DomainSettings) {
    const previousSettings = this.domainSettings;
    this.domainSettings = domainSettings;
    if (previousSettings) {
      this.applyUpdatedSettings(previousSettings);
    } else {
      this.initializeUI();
    }
  }

  private async toggleKenchi(shouldFocus = true) {
    if (this.changingOpen) {
      return;
    }
    this.changingOpen = true;
    this.open = !this.open;

    if (this.open && shouldFocus) {
      document.body.classList.add('explicitly-opened');
    }

    await this.applyStyles();
    // send open/close command after adding classes so transitions look nice and
    // we don't flash weird bits of content
    await this.messageRouter.sendCommand(
      'contentScript',
      this.open ? 'open' : 'close'
    );

    if (this.open && shouldFocus) {
      window.focus();
    }
    if (this.timingStart) {
      trackTelemetry('extension_tti', {
        action: this.timingFrom,
        duration_ms: Date.now() - this.timingStart,
      });
      this.timingStart = null;
    }
    this.changingOpen = false;
  }

  activateKenchi() {
    if (!this.open) {
      return this.toggleKenchi();
    } else if (document.hasFocus()) {
      // Still want to dispatch an event so SearchBox can activate
      window.dispatchEvent(new CustomEvent('kenchi:refocus'));
    } else {
      window.focus();
    }
  }

  hideKenchi() {
    // In some instances (e.g. Gmail's sidebar), it'll force the Kenchi iframe
    // open even if kenchi doesn't consider itself open. Ensure any hide
    // commands work as expected.
    if (!this.open) {
      this.open = true;
    }
    return this.toggleKenchi();
  }

  private moveOffEmptyURL() {
    if (this.history.location.pathname === '/empty') {
      this.history.replace('/');
    }
  }
}
