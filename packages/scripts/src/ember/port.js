const Ember = window.Ember;
const { Object: EmberObject, computed } = Ember;
const { or, readOnly } = computed;

export default EmberObject.extend(Ember.Evented, {
  adapter: readOnly('namespace.adapter'),
  applicationId: readOnly('namespace.applicationId'),
  applicationName: or(
    'namespace._application.name',
    'namespace._application.modulePrefix'
  ).readOnly(),

  /**
   * Unique id per application (not application instance). It's very important
   * that this id doesn't change when the app is reset otherwise the inspector
   * will no longer recognize the app.
   *
   * @property uniqueId
   * @type {String}
   */
  uniqueId: computed('namespace._application', function () {
    return Ember.guidFor(this.get('namespace._application'));
  }),

  init() {
    /**
     * Stores the timestamp when it was first accessed.
     *
     * @property now
     * @type {Number}
     */
    this.now = Date.now();

    this.get('adapter').onMessageReceived((message) => {
      if (
        this.get('uniqueId') === message.applicationId ||
        !message.applicationId
      ) {
        this.messageReceived(message.type, message);
      }
    });
  },

  messageReceived(name, message) {
    try {
      this.trigger(name, message);
    } catch (error) {
      this.adapter.handleError(error);
    }
  },

  send(to, messageType, options = {}) {
    options.type = messageType;
    options.from = 'inspectedWindow';
    options.applicationId = this.get('uniqueId');
    options.applicationName = this.get('applicationName');
    this.get('adapter').send(to, options);
  },
});
