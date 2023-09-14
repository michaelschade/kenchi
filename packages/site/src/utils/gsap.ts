import gsap from 'gsap';
import MotionPathPlugin from 'gsap/MotionPathPlugin';
import ScrollTrigger from 'gsap/ScrollTrigger';

import isDevelopment from './isDevelopment';

gsap.registerPlugin(ScrollTrigger);
// Font loading can cause reflow and ScrollTrigger doesn't monitor for it.
if (typeof document !== 'undefined') {
  document.fonts.ready.then(() => {
    ScrollTrigger.refresh();
  });
}

gsap.registerPlugin(MotionPathPlugin);

// Fixes jumping that happens on mobile scrollbar change.
ScrollTrigger.config({ ignoreMobileResize: true });

// Leave markers out on smaller screens as they screw up the layout.
ScrollTrigger.defaults({ markers: isDevelopment() && window.innerWidth > 600 });

export { MotionPathPlugin, ScrollTrigger };
export * from 'gsap';
