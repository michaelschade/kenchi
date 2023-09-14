/* eslint no-empty:0 */
import PortMixin from './portMixin';

const Ember = window.Ember;
const { Object: EmberObject } = Ember;

/**
 * Class that handles gathering general information of the inspected app.
 * ex:
 *  - Determines if the app was booted
 *  - Gathers the libraries. Found in the info tab of the inspector.
 *  - Gathers ember-cli configuration information from the meta tags.
 *
 * @module ember-debug/general-debug
 */
export default EmberObject.extend(PortMixin, {
  /**
   * Passed on creation.
   *
   * @type {EmberDebug}
   */
  namespace: null,

  /**
   * Used by the PortMixin
   *
   * @type {String}
   */
  portNamespace: 'general',

  /**
   * Sends a reply back indicating if the app has been booted.
   *
   * `__extension__booted` is a property set on the application instance
   * when the ember-debug is inserted into the target app.
   * see: startup-wrapper.
   */
  sendBooted() {
    ['app', 'hud'].forEach((destination) =>
      this.sendMessage(destination, 'applicationBooted', {
        booted: this.get('namespace.owner.__extension__booted'),
        timeOrigin: performance.timeOrigin,
        loadEventEnd:
          performance.getEntriesByType('navigation')[0].loadEventEnd,
      })
    );
  },

  /**
   * Sends a reply back indicating that ember-debug has been reset.
   * We need to reset ember-debug to remove state between tests.
   */
  sendReset() {
    this.sendMessage('app', 'reset');
    this.sendMessage('hud', 'reset');
  },
});
