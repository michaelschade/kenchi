import {
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import styled from '@emotion/styled';
import * as ToastPrimitive from '@radix-ui/react-toast';

import { Toast, ToastConfig } from './Toast';

const ToastViewport = styled(ToastPrimitive.Viewport)`
  bottom: 0;
  list-style: none;
  margin: 0;
  padding-right: 1.5rem;
  position: fixed;
  right: 0;
  z-index: 2147483647;
`;

type ToastContextType = {
  triggerToast: (config: ToastConfig) => void;
};

export const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Record<string, ToastConfig>>({});
  const toastKey = useRef(0);

  const value = useMemo(
    () => ({
      triggerToast: (toastConfig: ToastConfig) => {
        setToasts((toasts) => ({ ...toasts, [toastKey.current]: toastConfig }));
        toastKey.current++;
      },
    }),
    []
  );

  const removeToast = useCallback((key: string) => {
    setToasts((toasts) => {
      const newToasts = { ...toasts };
      delete newToasts[key];
      return newToasts;
    });
  }, []);

  // TODO: maybe figure out how to make renderedToasts be a memoized component
  // (Toaster) rather than returning the already-rendered Toast components here.
  // More like ConfirmDialog. When I tried to do that, I ran into a problem: the
  // Toasts weren't persisting. That is, whenever we triggered a new toasts,
  // we'd throw away all the old ones and render all new ones, each freshly
  // opened.
  const renderedToasts = Object.keys(toasts).map((toastKey) => (
    <Toast
      key={toastKey}
      {...toasts[toastKey]}
      onAfterClose={() => removeToast(toastKey)}
    />
  ));

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider duration={4000}>
        {children}
        {renderedToasts}
        <ToastViewport />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
};
