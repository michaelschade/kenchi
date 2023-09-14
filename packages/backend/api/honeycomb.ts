/* eslint-disable import/first */
import beeline from 'honeycomb-beeline';

const libhoneyInit = require('libhoney');

import { isDevelopment, isTesting } from './utils';

type LibhoneyEvent = {
  timestamp?: Date;
  addField(key: string, value: any): void;
  add(dataMap: Record<string, any>): void;
  send(): void;
};
type Libhoney = {
  newEvent: () => LibhoneyEvent;
};

let libhoneySingleton: Libhoney;
export function libhoney() {
  if (!libhoneySingleton) {
    libhoneySingleton = new libhoneyInit({
      writeKey: '742b6109060725908bdbe5e283fd591f',
      dataset: 'kenchi',
      disabled: isDevelopment(),
    });
  }
  return libhoneySingleton;
}

export function instrument(serviceName: string) {
  if (isDevelopment() || isTesting()) {
    return null;
  }
  return beeline({
    writeKey: '742b6109060725908bdbe5e283fd591f',
    dataset: 'kenchi',
    serviceName,
    express: {
      userContext: (req: Express.Request) =>
        req.session && { id: req.session.userId },
    },
  });
}
