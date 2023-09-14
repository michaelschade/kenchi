export const recomputeHeight = () => {
  const dialogHeight = document.querySelector(
    '[role="dialog"][data-state="open"]'
  )?.clientHeight;
  if (dialogHeight) {
    return dialogHeight + 65;
  }

  const menuHeight =
    document.querySelector('#hud-spaces-menu')?.clientHeight || 0;
  const appHeight = document.querySelector('#app')?.clientHeight || 0;
  return Math.min(300, Math.max(menuHeight + 60, appHeight));
};
