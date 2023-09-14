const Ember = window.Ember;
const { Object: EmberObject } = Ember;

export function cleanForMessaging(value) {
  if (typeof value === 'function') {
    return value.toString();
  } else if (Array.isArray(value)) {
    return value.map(cleanForMessaging);
  } else if (value instanceof EmberObject) {
    return value.toString();
  } else if (typeof value === 'object') {
    const rtn = {};
    for (var i in value) {
      rtn[i] = cleanForMessaging(value[i]);
    }
    return rtn;
  } else {
    return value;
  }
}
