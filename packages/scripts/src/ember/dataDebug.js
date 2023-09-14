import { cleanForMessaging } from './cleanForMessaging';
import PortMixin from './portMixin';

const Ember = window.Ember;
const { Object: EmberObject, computed, guidFor, set } = Ember;
const { alias } = computed;

export default EmberObject.extend(PortMixin, {
  init() {
    this._super();
    this.sentTypes = {};
    this.sentRecords = {};
  },

  watchTypesRelease: null,
  watchTypesInterestedOrigins: new Set(),

  wrappedRecordsByTypeName: {},
  releaseRecordWatchByTypeName: {},
  interestedOriginsByTypeName: {},

  adapter: computed('namespace.owner', function () {
    const owner = this.get('namespace.owner');

    // dataAdapter:main is deprecated
    let adapter =
      this._resolve('data-adapter:main') && owner.lookup('data-adapter:main');
    // column limit is now supported at the inspector level
    if (adapter) {
      set(adapter, 'attributeLimit', 100);
      return adapter;
    }

    return null;
  }),

  _resolve(name) {
    const owner = this.get('namespace.owner');

    return owner.resolveRegistration(name);
  },

  namespace: null,

  port: alias('namespace.port'),

  portNamespace: 'data',

  modelTypesAdded(types) {
    const typesToSend = types.map((type) => this.wrapType(type));
    [...this.watchTypesInterestedOrigins].forEach((to) =>
      this.sendMessage(to, 'modelTypesAdded', { modelTypes: typesToSend })
    );
  },

  modelTypesUpdated(types) {
    const typesToSend = types.map((type) => this.wrapType(type));
    [...this.watchTypesInterestedOrigins].forEach((to) =>
      this.sendMessage(to, 'modelTypesUpdated', { modelTypes: typesToSend })
    );
  },

  wrapType(type) {
    const objectId = guidFor(type.object);
    this.sentTypes[objectId] = {
      columns: type.columns,
      count: type.count,
      name: type.name,
      objectId,
    };

    return this.sentTypes[objectId];
  },

  recordsAdded(type, recordsReceived) {
    const records = recordsReceived.map((record) =>
      this.wrapRecord(type, record)
    );
    [...this.interestedOriginsByTypeName[type]].forEach((to) =>
      this.sendMessage(to, 'recordsAdded', { records })
    );
  },

  recordsUpdated(type, recordsReceived) {
    const records = recordsReceived.map((record) =>
      this.wrapRecord(type, record)
    );
    [...this.interestedOriginsByTypeName[type]].forEach((to) =>
      this.sendMessage(to, 'recordsUpdated', { records })
    );
  },

  recordsRemoved(type, index, count) {
    [...this.interestedOriginsByTypeName[type]].forEach((to) =>
      this.sendMessage(to, 'recordsRemoved', { index, count })
    );
  },

  wrapRecord(type, record) {
    const objectId = guidFor(record.object);
    const modelName = record.object.get('constructor.modelName');
    let columnValues = cleanForMessaging(record.columnValues);
    this.sentRecords[objectId] = record;

    const extra = {};

    // OMG this is the worst hack I'm so sad
    if (record.object.__lookupGetter__('participants')) {
      try {
        extra.participants = record.object.participants.map((p) => p.id);
      } catch (e) {
        // NOOP
      }
    } else if (record.object.__lookupGetter__('actions')) {
      try {
        extra.actions = record.object.actions.arrangedContent.map((p) => ({
          actionData: p.actionData,
          type: p.type,
        }));
      } catch (e) {
        extra.actionsError = e;
      }
    }

    const wrappedRecord = {
      modelName,
      columnValues,
      objectId,
      extra,
    };

    if (!this.wrappedRecordsByTypeName[type]) {
      this.wrappedRecordsByTypeName[type] = {};
    }
    this.wrappedRecordsByTypeName[type][objectId] = wrappedRecord;

    return wrappedRecord;
  },

  releaseTypes(from) {
    this.watchTypesInterestedOrigins.delete(from);
    if (this.watchTypesRelease && this.watchTypesInterestedOrigins.size === 0) {
      this.watchTypesRelease();
      this.watchTypesRelease = null;
      this.sentTypes = {};
    }
  },

  releaseRecords(from) {
    Object.entries(this.interestedOriginsByTypeName).forEach(
      ([typeName, origins]) => {
        if (origins.has(from)) {
          origins.delete(from);
        }
        if (origins.size === 0) {
          this.releaseRecordWatchByTypeName[typeName]();
          delete this.releaseRecordWatchByTypeName[typeName];
          delete this.interestedOriginsByTypeName[typeName];
          delete this.wrappedRecordsByTypeName[typeName];
        }
      }
    );
  },

  willDestroy() {
    this._super();
    if (this.watchTypesRelease) {
      this.watchTypesRelease();
    }
    Object.values(this.releaseRecordWatchByTypeName).forEach((release) =>
      release()
    );
  },

  messages: {
    getModelTypes({ from }) {
      this.releaseTypes(from);
      this.watchTypesInterestedOrigins.add(from);
      if (this.watchTypesRelease) {
        this.sendMessage(from, 'modelTypesAdded', {
          modelTypes: Object.values(this.sentTypes),
        });
      } else {
        this.watchTypesRelease = this.get('adapter').watchModelTypes(
          (types) => {
            this.modelTypesAdded(types);
          },
          (types) => {
            this.modelTypesUpdated(types);
          }
        );
      }
    },

    releaseModelTypes({ from }) {
      this.releaseTypes(from);
    },

    getRecords({ from, objectId }) {
      const type = this.sentTypes[objectId];

      let typeOrName;
      if (this.get('adapter.acceptsModelName')) {
        // Ember >= 1.3
        typeOrName = type.name;
      }

      if (!this.interestedOriginsByTypeName[typeOrName]) {
        this.interestedOriginsByTypeName[typeOrName] = new Set([from]);

        const releaseMethod = this.get('adapter').watchRecords(
          typeOrName,
          (recordsReceived) => {
            this.recordsAdded(typeOrName, recordsReceived);
          },
          (recordsUpdated) => {
            this.recordsUpdated(typeOrName, recordsUpdated);
          },
          (...args) => {
            this.recordsRemoved(typeOrName, ...args);
          }
        );
        this.releaseRecordWatchByTypeName[typeOrName] = releaseMethod;
      } else {
        this.interestedOriginsByTypeName[typeOrName].add(from);
      }

      if (this.wrappedRecordsByTypeName[typeOrName]) {
        this.sendMessage(from, 'recordsAdded', {
          records: Object.values(this.wrappedRecordsByTypeName[typeOrName]),
        });
      }
    },

    releaseRecords({ from }) {
      this.releaseRecords(from);
    },
  },
});
