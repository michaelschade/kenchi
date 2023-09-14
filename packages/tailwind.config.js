const colors = require('tailwindcss/colors');

module.exports = {
  // Disable tailwind preflight/base styles reset so that we don't override
  // existing styles. One day we'll want to remove this once we've moved more
  // things over to Tailwind and there'll likely be a lot of nitpicky details to
  // track down because of it.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontSize: {
        xxs: '0.625rem',
      },
      colors: {
        gray: colors.blueGray,
        teal: colors.teal,
        cyan: colors.cyan,
        lime: colors.lime,
      },
      boxShadow: {
        soft: '0px 0px 15px 0px hsla(282, 18%, 40%, 0.1)',
        'soft-md': '0px 0px 15px 5px hsla(282, 18%, 40%, 0.15)',
        'soft-lg': '0px 0px 15px 5px hsla(282, 18%, 40%, 0.3)',
      },
    },
  },
};
