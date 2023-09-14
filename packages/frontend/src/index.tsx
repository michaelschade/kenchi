// Tell TS about css props so we can use them everywhere. Once we've
// upgraded TS to 4.1+ and migrated to @emotion/babel-plugin, we should
// be able to remove this.
// https://emotion.sh/docs/emotion-11#css-prop-types
/// <reference types="@emotion/react/types/css-prop" />

import './global';
import 'bootstrap/dist/css/bootstrap-reboot.css';
import './index.css';

import { StrictMode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _Sentry from '@sentry/react'; // Has side effects
import ReactDOM from 'react-dom';

import App from './App';
import GlobalStyles from './GlobalStyles';
import { initSentry } from './utils/sentry';

initSentry();
ReactDOM.render(
  <StrictMode>
    <GlobalStyles />
    <App />
  </StrictMode>,
  document.getElementById('root')
);
