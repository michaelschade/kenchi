import getMessageRouter from '../getMessageRouter';

const router = getMessageRouter();

function getStyles() {
  return [...document.styleSheets].map((styleSheet) => {
    return {
      disabled: styleSheet.disabled,
      href: styleSheet.href,
      media: [...styleSheet.media],
      rules: [...styleSheet.cssRules].map((rules) => rules.cssText),
    };
  });
}

router.addCommandHandler('app', 'domSnapshotCapture', async () => {
  let styles;
  let error;
  try {
    styles = getStyles();
  } catch (e) {
    if (e instanceof Error) {
      error = e.toString();
    } else {
      throw e;
    }
  }
  return {
    location: window.location.toString(),
    html: document.documentElement.outerHTML,
    styles,
    error,
  };
});
