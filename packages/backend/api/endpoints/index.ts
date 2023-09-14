import 'express-async-errors';

import { Express, urlencoded } from 'express';

import getConfig from '../config';
import { getDB } from '../db';
import { queueTest } from '../queue';
import registerAdminEndpoints from './admin';
import registerLogEndpoints from './logs';

export default function registerEndpoints(server: Express) {
  const db = getDB();

  registerAdminEndpoints(server);
  registerLogEndpoints(server);

  server.get('/', (_req, res) => {
    res.json({
      site: getConfig().appHost,
      work_with_us: 'brian@kenchi.com',
    });
  });

  server.get('/healthz', (_req, res) => {
    // TODO - run a DB health check? GQL query?
    res.json({ healthy: true });
  });

  server.get('/trigger500', (_req, _res) => {
    // @ts-ignore
    notAFunction();
  });

  server.post(
    '/test_queue',
    urlencoded({ extended: true }),
    async (req, res) => {
      const job = await queueTest(parseInt(req.body.x), parseInt(req.body.y));
      res.json({ success: true, id: job.id });
    }
  );

  server.get('/skip_versions', (_req, res) => {
    res.json({
      versions: [
        // Didn't handle logged out state properly
        'frontend@0ab8f346af132ecd1f4db9022ee88c1b4f60dbc5',
        'frontend@489031102cb1807abaa8fa8ac1754b3cd7015944',
        // https://sentry.io/organizations/kenchi/issues/1755772309/
        'frontend@31f1927a76cc7e4f016eb1d58266f6a026b66e25',
        // Pushing upgrades before switching over to tsbackend
        'frontend@e96c7052bcdf4da52c6bb6385369f12847daa1d7',
        'frontend@d22cdbde880210cb3102f1418190f8d55cc4c6fb',
        // 400s due to change from node(id: String!) to node(id: ID!)
        'frontend@8fb623041ac811a9aa4ef564d269d8a4f4840275',
        // Bad cache key for lastSynced*Nodes
        'frontend@beac30857d1710bd239d70a811e90db38b884c1f',
        // Old permissions endpoint
        'frontend@521c7e4ab6cc077146605e3be6d7fea24be0f6a2',
        // Broken previews in new automations causes full-page crash
        'frontend@b895382c6ff053ed35caedac9aeb936db2105208',
        // Wrong logging endpoint
        'frontend@89291c2976d640e4638181962a7cd525afd889ac',
        // Broke running snippets with custom inputs
        'frontend@10fd63488508f1cde494e415803636285a58ddaf',
        // Broke page variable filling
        'frontend@d7256c84c52e1736e2ce362d10aba6704da7b1ed',
        // Missing HotkeyProvider in SlateDiff
        'frontend@98460431b3a30b4abbce57f88e3202bbdc438473',
        // Last revision that had default permissions bug
        // https://kenchi-workspace.slack.com/archives/C01051ZDERG/p1642205670010200?thread_ts=1642203623.008200&cid=C01051ZDERG
        // https://github.com/kenchi/kenchi/commit/1dd38ffd61af3fa927791696c8b061ab69fc7188
        'frontend@4429a467a0195fdcf6ab44359c910f7d346d5735',
      ],
    });
  });

  server.post('/waitlist', urlencoded({ extended: true }), async (req, res) => {
    const email = typeof req.body === 'object' ? req.body.email : null;
    if (!email) {
      res.json({ success: false });
      return;
    }
    await db.waitlist.create({ data: { email } });

    res.json({ success: true });
  });
}
