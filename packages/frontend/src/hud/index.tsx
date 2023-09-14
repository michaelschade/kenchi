// Tell TS about css props so we can use them everywhere. Once we've
// upgraded TS to 4.1+ and migrated to @emotion/babel-plugin, we should
// be able to remove this.
// https://emotion.sh/docs/emotion-11#css-prop-types
/// <reference types="@emotion/react/types/css-prop" />

import '../global';
import 'bootstrap/dist/css/bootstrap-reboot.css';
import '../index.css';

import { StrictMode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _Sentry from '@sentry/react'; // Has side effects
import ReactDOM from 'react-dom';
import { globalStyles } from 'twin.macro';

import GlobalStyles from '@kenchi/ui/lib/GlobalStyles';

import { initSentry } from '../utils/sentry';
import App from './App';

initSentry();
ReactDOM.render(
  <StrictMode>
    <GlobalStyles globalStyles={globalStyles} />
    <App />
  </StrictMode>,
  document.getElementById('root')
);
