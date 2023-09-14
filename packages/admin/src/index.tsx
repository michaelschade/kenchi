// Tell TS about css props so we can use them everywhere. Once we've
// upgraded TS to 4.1+ and migrated to @emotion/babel-plugin, we should
// be able to remove this.
// https://emotion.sh/docs/emotion-11#css-prop-types
/// <reference types="@emotion/react/types/css-prop" />

import './index.css';

import { StrictMode } from 'react';

import ReactDOM from 'react-dom';

import App from './App';
import GlobalStyles from './GlobalStyles';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <StrictMode>
    <GlobalStyles />
    <App />
  </StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
