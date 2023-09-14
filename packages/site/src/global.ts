declare global {
  interface Window {
    fathom: {
      // https://usefathom.com/docs/features/events
      trackGoal: (eventId: string, value: number) => void;
    };
  }
}

// Needs an export
const __globalNoop = {};
export default __globalNoop;
