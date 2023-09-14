type ReactAppRootElement = Element & {
  _reactRootContainer?: { _internalRoot: { current: any } };
};
export const findReduxStore = (appRootSelector: string) => {
  const appRootElement: ReactAppRootElement | null =
    document.querySelector(appRootSelector);
  if (!appRootElement) {
    throw new Error(`Root element ${appRootSelector} not found`);
  }
  if (!('_reactRootContainer' in appRootElement)) {
    throw new Error(
      `Root element '${appRootSelector}' is not a react root container`
    );
  }
  const reactApp = appRootElement._reactRootContainer?._internalRoot?.current;
  return traverseChildren(reactApp);
};

// TODO: maybe add a little typing here
const traverseChildren = (node: any, depth: number = 1): any => {
  if (depth > 10) {
    throw new Error('Too many levels of children traversed for redux store');
  }
  const props = node.memoizedProps;
  if (props && props.store) {
    return props.store;
  }
  if (node.child) {
    return traverseChildren(node.child, depth + 1);
  }

  return null;
};
