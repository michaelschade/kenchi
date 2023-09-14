/* eslint camelcase:0 */
// Forked from https://github.com/emberjs/ember-inspector/blob/74916ba0490ceb9eb19fe65ca20c7eac92acb72b/ember_debug/vendor/startup-wrapper.js
/**
 This is a wrapper for `ember-debug.js`
 Wraps the script in a function,
 and ensures that the script is executed
 only after the dom is ready
 and the application has initialized.

 Also responsible for sending the first tree.
 **/
/*eslint prefer-spread: 0 */
/* globals Ember, define, env */
var currentEnv = 'production';
if (typeof env !== 'undefined') {
  currentEnv = env;
}

export const EMBER_VARIABLE_NAME = 'ExtensionEmberData';
const BOOTED_VARIABLE_NAME = '__extension__booted';

(function () {
  onEmberReady(function () {
    // prevent from injecting twice
    if (!Ember[EMBER_VARIABLE_NAME]) {
      // Make sure we only work for the supported version
      define('ember-debug/config', function () {
        return {
          default: {
            environment: currentEnv,
          },
        };
      });
      window[EMBER_VARIABLE_NAME] = Ember[EMBER_VARIABLE_NAME] =
        require('./main')['default'];
      Ember[EMBER_VARIABLE_NAME].Adapter =
        require('./chromeAdapter')['default'];

      onApplicationStart((instance) => {
        let app = instance.application;
        if (!(BOOTED_VARIABLE_NAME in app)) {
          // Watch for app reset/destroy
          app.reopen({
            reset: function () {
              this[BOOTED_VARIABLE_NAME] = false;
              this._super.apply(this, arguments);
            },
          });
        }

        if (instance && !(BOOTED_VARIABLE_NAME in instance)) {
          instance.reopen({
            // Clean up on instance destruction
            willDestroy() {
              if (Ember[EMBER_VARIABLE_NAME].get('owner') === instance) {
                Ember[EMBER_VARIABLE_NAME].destroyContainer();
                Ember[EMBER_VARIABLE_NAME].clear();
              }
              return this._super.apply(this, arguments);
            },
          });

          if (!Ember[EMBER_VARIABLE_NAME]._application) {
            bootEmberInspector(instance);
          }
        }
      });
    }
  });

  function bootEmberInspector(appInstance) {
    appInstance.application[BOOTED_VARIABLE_NAME] = true;
    appInstance[BOOTED_VARIABLE_NAME] = true;

    // Boot the inspector (or re-boot if already booted, for example in tests)
    Ember[EMBER_VARIABLE_NAME].set('_application', appInstance.application);
    Ember[EMBER_VARIABLE_NAME].set('owner', appInstance);
    Ember[EMBER_VARIABLE_NAME].start(true);
  }

  function onEmberReady(callback) {
    var triggered = false;
    var triggerOnce = function (string) {
      if (triggered) {
        return;
      }
      if (!window.Ember) {
        return;
      }
      // `Ember.Application` load hook triggers before all of Ember is ready.
      // In this case we ignore and wait for the `Ember` load hook.
      if (!window.Ember.RSVP) {
        return;
      }
      triggered = true;
      callback();
    };

    // Newest Ember versions >= 1.10
    window.addEventListener('Ember', triggerOnce, false);
    // Old Ember versions
    window.addEventListener(
      'Ember.Application',
      function () {
        if (
          window.Ember &&
          window.Ember.VERSION &&
          compareVersion(window.Ember.VERSION, '1.10.0') === 1
        ) {
          // Ember >= 1.10 should be handled by `Ember` load hook instead.
          return;
        }
        triggerOnce();
      },
      false
    );
    // Oldest Ember versions or if this was injected after Ember has loaded.
    onReady(triggerOnce);
  }

  // There's probably a better way
  // to determine when the application starts
  // but this definitely works
  function onApplicationStart(callback) {
    if (typeof Ember === 'undefined') {
      return;
    }

    var apps = getApplications();

    // sendApps(adapterInstance, apps);

    var app;
    for (var i = 0, l = apps.length; i < l; i++) {
      app = apps[i];
      // We check for the existance of an application instance because
      // in Ember > 3 tests don't destroy the app when they're done but the app has no booted instances.
      if (app._readinessDeferrals === 0) {
        let instance =
          app.__deprecatedInstance__ ||
          (app._applicationInstances && app._applicationInstances[0]);
        if (instance) {
          // App started
          setupInstanceInitializer(app, callback);
          callback(instance);
          break;
        }
      }
    }
    Ember.Application.initializer({
      name: 'ember-inspector-booted',
      initialize: function (app) {
        setupInstanceInitializer(app, callback);
      },
    });
  }

  function setupInstanceInitializer(app, callback) {
    if (!app.__inspector__setup) {
      app.__inspector__setup = true;

      // We include the app's guid in the initializer name because in Ember versions < 3
      // registering an instance initializer with the same name, even if on a different app,
      // triggers an error because instance initializers seem to be global instead of per app.
      app.instanceInitializer({
        name: 'ember-inspector-app-instance-booted-' + Ember.guidFor(app),
        initialize: function (instance) {
          callback(instance);
        },
      });
    }
  }

  /**
   * Get all the Ember.Application instances from Ember.Namespace.NAMESPACES
   * and add our own applicationId and applicationName to them
   * @return {*}
   */
  function getApplications() {
    var namespaces = Ember.A(Ember.Namespace.NAMESPACES);

    var apps = namespaces.filter(function (namespace) {
      return namespace instanceof Ember.Application;
    });

    return apps.map(function (app) {
      // Add applicationId and applicationName to the app
      var applicationId = Ember.guidFor(app);
      var applicationName =
        app.name || app.modulePrefix || `(unknown app - ${applicationId})`;

      Object.assign(app, {
        applicationId,
        applicationName,
      });

      return app;
    });
  }

  // function sendApps(adapter, apps) {
  //   const serializedApps = apps.map(app => {
  //     return {
  //       applicationName: app.applicationName,
  //       applicationId: app.applicationId
  //     }
  //   });

  //   adapter.sendMessage({
  //     type: 'apps-loaded',
  //     apps: serializedApps,
  //     from: 'inspectedWindow'
  //   });
  // }

  function onReady(callback) {
    if (
      document.readyState === 'complete' ||
      document.readyState === 'interactive'
    ) {
      setTimeout(completed);
    } else {
      document.addEventListener('DOMContentLoaded', completed, false);
      // For some reason DOMContentLoaded doesn't always work
      window.addEventListener('load', completed, false);
    }

    function completed() {
      document.removeEventListener('DOMContentLoaded', completed, false);
      window.removeEventListener('load', completed, false);
      callback();
    }
  }

  /**
   * Compares two Ember versions.
   *
   * Returns:
   * `-1` if version1 < version
   * 0 if version1 == version2
   * 1 if version1 > version2
   *
   * @param {String} version1
   * @param {String} version2
   * @return {Boolean} result of the comparison
   */
  function compareVersion(version1, version2) {
    let compared, i;
    version1 = cleanupVersion(version1).split('.');
    version2 = cleanupVersion(version2).split('.');
    for (i = 0; i < 3; i++) {
      compared = compare(+version1[i], +version2[i]);
      if (compared !== 0) {
        return compared;
      }
    }
    return 0;
  }

  /**
   * Remove -alpha, -beta, etc from versions
   *
   * @param {String} version
   * @return {String} The cleaned up version
   */
  function cleanupVersion(version) {
    return version.replace(/-.*/g, '');
  }

  /**
   * @method compare
   * @param {Number} val
   * @param {Number} number
   * @return {Number}
   *  0: same
   * -1: <
   *  1: >
   */
  function compare(val, number) {
    if (val === number) {
      return 0;
    } else if (val < number) {
      return -1;
    } else if (val > number) {
      return 1;
    }
  }
})();
