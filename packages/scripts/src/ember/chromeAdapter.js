/* globals requireModule */
/* eslint no-console: 0 */
import getMessageRouter from '../getMessageRouter';

const Ember = window.Ember;
const { computed, Object: EmberObject } = Ember;

export default EmberObject.extend({
  init() {
    this.router = getMessageRouter();
    ['app', 'hud'].forEach((origin) =>
      this.router.addCommandHandler(origin, 'emberCommand', (message) =>
        this._messageReceived(origin, message)
      )
    );

    window.onunload = () => {
      this.send({
        unloading: true,
      });
    };

    this._messageCallbacks = [];
  },

  /**
   * Uses the current build's config module to determine
   * the environment.
   *
   * @property environment
   * @type {String}
   */
  environment: computed(function () {
    return requireModule('ember-debug/config')['default'].environment;
  }),

  debug() {
    return console.debug(...arguments);
  },

  log() {
    return console.log(...arguments);
  },

  /**
   * A wrapper for `console.warn`.
   *
   * @method warn
   */
  warn() {
    return console.warn(...arguments);
  },

  /**
    Register functions to be called
    when a message from EmberExtension is received

    @param {Function} callback
  */
  onMessageReceived(callback) {
    this._messageCallbacks.push(callback);
  },

  _messageReceived(from, message) {
    this._messageCallbacks?.forEach((callback) => {
      callback({ ...message, from });
    });
    return Promise.resolve();
  },

  /**
   * Handle an error caused by EmberDebug.
   *
   * This function rethrows in development and test envs,
   * but warns instead in production.
   *
   * The idea is to control errors triggered by the inspector
   * and make sure that users don't get mislead by inspector-caused
   * bugs.
   *
   * @method handleError
   * @param {Error} error
   */
  handleError(error) {
    this.router.send('contentScript', 'report', {
      message: 'EmberDebug error',
      extra: { error },
    });
  },

  willDestroy() {
    this._super();
  },

  /**
    Used to send messages to EmberExtension

    @param {Object} type the message to the send
  */
  send(to, options) {
    this.router.sendCommand(to, 'emberCommand', options, {
      confirmReceipt: false,
    });
  },
});
