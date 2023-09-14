import { useEffect, useRef, useState } from 'react';

import { confetti } from 'dom-confetti';

import { isExtension } from '../utils';
import { trackEvent } from '../utils/analytics';
import useMessageRouter from '../utils/useMessageRouter';

export const TIMEOUT = 5500;

export default function Confetti({ render = false }) {
  const [yay, setYay] = useState(render);
  const messageRouter = useMessageRouter<'app'>();

  useEffect(() => {
    if (render) {
      setYay(true);
    }
  }, [render]);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (yay) {
      if (isExtension()) {
        messageRouter.sendCommand('contentScript', 'confetti');
      } else if (ref.current) {
        console.log('CONFETTI!!!!!');
        confetti(ref.current, {
          angle: 90,
          spread: 130,
          startVelocity: 70,
          elementCount: 160,
          dragFriction: 0.1,
          duration: 5000,
          stagger: 0,
          width: '10px',
          height: '5px',
          colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'],
        });
      }
      window.setTimeout(() => setYay(false), TIMEOUT);
      trackEvent({
        category: 'confetti',
        action: 'confetti',
        label: 'Mandatory fun mode: confetti',
      });
    }
  }, [yay, ref, messageRouter]);

  return (
    <div ref={ref} style={{ position: 'fixed', bottom: 0, left: '50%' }} />
  );
}
