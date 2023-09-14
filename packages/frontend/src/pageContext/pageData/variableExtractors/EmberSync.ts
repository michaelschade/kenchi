import { captureMessage } from '@sentry/react';

export type EmberMessageBlob = { [key: string]: any };
export type RecordObserver = (record: EmberMessageBlob) => void;

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: number;
  return function (this: any, ...args: any[]) {
    const context = this;
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => func.apply(context, args), delay);
  };
};

// When we initialize too quickly we get partially-initialized data models (i.e.
// they have an ID but every field is undefined). Make sure we wait at least
// this long after the main page load completed to do our sync.
const INITIALIZE_DELAY = 4000;

export default class EmberSync {
  private bootedTime?: number | null;
  private relevantModelTypes: Set<string>;
  private modelTypes: { [emberId: string]: EmberMessageBlob } = {};
  private modelTypeColumns: { [emberId: string]: Set<string> } = {};

  public initialLoadComplete: boolean = false;
  public recordsByType: {
    [type: string]: { [emberId: string]: EmberMessageBlob };
  } = {};

  public me: EmberMessageBlob | null = null;
  private meObserver: RecordObserver | null = null;

  // List of IDs by type
  private observedRecords: Record<string, Map<string, RecordObserver>> = {};

  constructor(
    relevantModelTypes: string[],
    private modelTypesNeededForInitialization: string[],
    private messageSender: (
      type: string,
      args: EmberMessageBlob
    ) => Promise<void>
  ) {
    this.relevantModelTypes = new Set(relevantModelTypes);
  }

  private sendMessage(type: string, details: EmberMessageBlob = {}) {
    return this.messageSender(type, details);
  }

  handleMessage = (message: EmberMessageBlob) => {
    switch (message.type) {
      case 'general:applicationBooted':
        this.bootedTime = Date.now();
        if (!message.loadEventEnd) {
          captureMessage('EmberSync ran before load event completed');
        }
        const loadTime = Math.round(message.timeOrigin + message.loadEventEnd);
        const timeSinceLoad = new Date().getTime() - loadTime;
        const delay = INITIALIZE_DELAY - timeSinceLoad;
        window.setTimeout(() => {
          this.sendMessage('data:getModelTypes');
        }, Math.max(delay, 0));
        break;
      case 'data:modelTypesAdded':
        Object.assign(
          this.modelTypes,
          this.filterModelTypes(message.modelTypes)
        );
        this.recomputeModelTypeColumns();
        break;
      case 'data:modelTypesUpdated':
        Object.assign(
          this.modelTypes,
          this.filterModelTypes(message.modelTypes)
        );
        this.recomputeModelTypeColumns();
        break;
      case 'data:recordsAdded':
        this.handleRecords(message.records, message.type);
        break;
      case 'data:recordsUpdated':
        this.handleRecords(message.records, message.type);
        break;
      case 'data:recordsRemoved':
        // TODO
        break;
      default:
        console.log('unexpected message received', message);
        break;
    }
    return Promise.resolve();
  };

  async resync() {
    this.bootedTime = Date.now();
    await Promise.all([
      this.sendMessage('data:releaseModelTypes'),
      this.sendMessage('data:releaseRecords'),
    ]);
    await this.sendMessage('data:getModelTypes');
  }

  trackModelType(name: string) {
    if (!this.relevantModelTypes.has(name)) {
      this.relevantModelTypes.add(name);
      if (name in this.modelTypes) {
        const modelType = this.modelTypes[name];
        console.debug(
          `Requesting records for ${modelType.name} (${modelType.objectId}, ${modelType.count})`
        );
        this.sendMessage('data:getRecords', { objectId: modelType.objectId });
      }
    }
  }

  private filterModelTypes(modelTypes: EmberMessageBlob[]) {
    const rtn: Record<string, EmberMessageBlob> = {};
    modelTypes.forEach((modelType) => {
      rtn[modelType.name] = modelType;
      if (this.modelTypes[modelType.name]) {
        console.debug(
          `Got count update for ${modelType.name} (${
            this.modelTypes[modelType.name].count
          } => ${modelType.count})`
        );
      } else if (this.relevantModelTypes.has(modelType.name)) {
        console.debug(
          `Got model type for ${modelType.name} (${modelType.objectId}, ${modelType.count}), requesting records`
        );
        this.sendMessage('data:getRecords', { objectId: modelType.objectId });
      }
    });
    return rtn;
  }

  clearObservers() {
    this.observedRecords = {};
    this.meObserver = null;
  }

  observeRecord(modelName: string, id: string, observer: RecordObserver) {
    if (!this.observedRecords[modelName]) {
      this.observedRecords[modelName] = new Map();
    }
    if (this.observedRecords[modelName].has(id)) {
      throw new Error('Cannot double-observe record');
    }

    // We usually get a lot of prop updates at the same time, so debounce
    const debounced = debounce(observer, 100);
    this.observedRecords[modelName].set(id, debounced);
  }

  observeMe(observer: RecordObserver) {
    if (this.meObserver) {
      throw new Error('Cannot double-observe self');
    }
    this.meObserver = observer;
  }

  private handleRecords(records: EmberMessageBlob[], messageType: string) {
    let lastModelName: string | null = null;
    records.forEach((record) => {
      const modelName: string = record.modelName;
      if (!this.recordsByType[modelName]) {
        this.recordsByType[modelName] = {};
      }

      this.recordsByType[modelName][record.objectId] = record;

      const observer =
        this.observedRecords[modelName] &&
        this.observedRecords[modelName].get(record.columnValues.id);
      observer?.(record);

      if (modelName === 'admin') {
        if (record.columnValues.is_me) {
          this.me = record;
          this.meObserver?.(record);
        }
      }

      lastModelName = modelName;
    });

    console.debug(
      `Handled ${records.length} ${messageType} records of ${lastModelName}`
    );
    if (lastModelName === 'user') {
      const missingValues = Object.values(records[0].columnValues).filter(
        (v) => v === undefined
      );
      if (missingValues.length > 50) {
        // I can't figure out a way to recover from this besides a full refresh. Just log for now.
        captureMessage('Got mostly undefined user model');
        console.log('Got mostly undefined user model');
      }
    }
    if (
      this.bootedTime &&
      this.modelTypesNeededForInitialization.every(
        (modelType) => modelType in this.recordsByType
      )
    ) {
      console.log(
        `Completed initial EmberSync in ${Date.now() - this.bootedTime}ms`
      );
      this.bootedTime = null;
      this.initialLoadComplete = true;
    }
  }

  private recomputeModelTypeColumns() {
    this.modelTypeColumns = {};
    for (var modelTypeName in this.modelTypes) {
      this.modelTypeColumns[modelTypeName] = new Set(
        this.modelTypes[modelTypeName].columns.map(
          (c: EmberMessageBlob) => c.name
        )
      );
    }
  }

  findObject(type: string, id: string) {
    const objects = this.recordsByType[type];
    for (var objectId in objects) {
      if (objects[objectId].columnValues.id === id) {
        return objects[objectId];
      }
    }
    return null;
  }
}
