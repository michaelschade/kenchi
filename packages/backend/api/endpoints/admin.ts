import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Express } from 'express';

import { getQueue } from '../queue';

export default function registerAdminEndpoints(server: Express) {
  if (process.env.ADMIN !== 'true') {
    return;
  }

  const serverAdapter = new ExpressAdapter();

  createBullBoard({
    queues: [new BullAdapter(getQueue())],
    serverAdapter: serverAdapter,
  });

  serverAdapter.setBasePath('/admin/queues');
  server.use('/admin/queues', serverAdapter.getRouter());
}
