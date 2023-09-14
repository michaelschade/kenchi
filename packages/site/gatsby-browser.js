require('bootstrap/dist/css/bootstrap-reboot.min.css');
require('./src/base.css');

// Magic function name for the Gatsby API: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-browser/#shouldUpdateScroll
exports.shouldUpdateScroll = ({
  routerProps: { location },
  prevRouterProps,
}) => {
  if (
    location.pathname === '/jobs' &&
    prevRouterProps?.location.pathname === '/jobs'
  ) {
    return false;
  }
};
