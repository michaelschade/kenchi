export const BreakpointsInt = {
  medium: 1200,
  small: 800,
};

const Breakpoints = {
  medium: `@media (max-width: ${BreakpointsInt.medium}px)`,
  small: `@media (max-width: ${BreakpointsInt.small}px)`,
};

export default Breakpoints;
