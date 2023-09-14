import { ReactElement, ReactNode } from 'react';

import { ThemeProvider } from '@emotion/react';
import { render as renderRaw } from '@testing-library/react';

import { lightTheme } from './Colors';
import { ToastProvider } from './Toast';

export const render = (ui: ReactElement) => {
  const wrapper = ({ children }: { children?: ReactNode }) => {
    return (
      <ThemeProvider theme={lightTheme}>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    );
  };
  return renderRaw(ui, { wrapper });
};
