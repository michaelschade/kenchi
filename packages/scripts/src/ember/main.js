import Adapter from './chromeAdapter';
import DataDebug from './dataDebug';
import GeneralDebug from './generalDebug';
import Port from './port';

const Ember = window.Ember;
const {
  Object: EmberObject,
  run,
  Application,
  Namespace,
  guidFor,
  computed,
} = Ember;

const EmberDebug = EmberObject.extend({
  /**
   * Set to true during testing.
   *
   * @type {Boolean}
   * @default false
   */
  isTesting: false,

  /**
   * @private
   * @property _application
   * @type {Application}
   */
  _application: null,

  owner: null,
  started: false,

  applicationName: computed
    .or('_application.name', '_application.modulePrefix')
    .readOnly(),

  /**
   * We use the application's id instead of the owner's id so that we use the same inspector
   * instance for the same application even if it was reset (owner changes on reset).
   *
   * @property applicationId
   * @type {String}
   */
  applicationId: computed('_application', 'isTesting', 'owner', function () {
    if (!this.get('isTesting')) {
      return guidFor(this.get('_application'));
    }
    return guidFor(this.get('owner'));
  }),

  // Using object shorthand syntax here is somehow having strange side effects.
  // eslint-disable-next-line object-shorthand
  Port: Port,
  Adapter: Adapter,

  start($keepAdapter) {
    if (this.get('started')) {
      this.reset($keepAdapter);
      return;
    }
    if (!this.get('_application') && !this.get('isTesting')) {
      this.set('_application', getApplication());
    }
    this.set('started', true);

    this.reset();

    this.get('adapter').sendMessage({
      type: 'inspectorLoaded',
    });
  },

  destroyContainer() {
    if (this.get('generalDebug')) {
      this.get('generalDebug').sendReset();
    }
    ['dataDebug', 'generalDebug'].forEach((prop) => {
      let handler = this.get(prop);
      if (handler) {
        run(handler, 'destroy');
        this.set(prop, null);
      }
    });
  },

  startModule(prop, Module) {
    this.set(prop, Module.create({ namespace: this }));
  },

  willDestroy() {
    this.destroyContainer();
    this._super(...arguments);
  },

  reset($keepAdapter) {
    if (!this.get('isTesting') && !this.get('owner')) {
      this.set('owner', getOwner(this.get('_application')));
    }
    this.destroyContainer();
    run(() => {
      // Adapters don't have state depending on the application itself.
      // They also maintain connections with the inspector which we will
      // lose if we destroy.
      if (!this.get('adapter') || !$keepAdapter) {
        this.startModule('adapter', this.Adapter);
      }
      if (!this.get('port') || !$keepAdapter) {
        this.startModule('port', this.Port);
      }

      this.startModule('generalDebug', GeneralDebug);
      this.startModule('dataDebug', DataDebug);

      this.generalDebug.sendBooted();
    });
  },

  clear() {
    this.setProperties({
      _application: null,
      owner: null,
    });
  },
}).create();

function getApplication() {
  let namespaces = Namespace.NAMESPACES;
  let application;

  namespaces.forEach((namespace) => {
    if (namespace instanceof Application) {
      application = namespace;
      return false;
    }
  });
  return application;
}

function getOwner(application) {
  if (application.autoboot) {
    return application.__deprecatedInstance__;
  } else if (application._applicationInstances /* Ember 3.1+ */) {
    return application._applicationInstances[0];
  }
}

export default EmberDebug;
