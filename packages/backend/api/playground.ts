import { Express } from 'express';

import { isAdmin, isDevelopment } from './utils';

export default function maybeRegisterPlayground(express: Express) {
  if (!isDevelopment() && !isAdmin()) {
    return;
  }
  express.get('/playground', (req, res) => {
    const settingsString = JSON.stringify({
      endpoint: '/graphql',
      headers: req.csrfToken ? { 'X-CSRFToken': req.csrfToken() } : {},
      settings: { 'request.credentials': 'include' },
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset=utf-8/>
        <meta name="viewport" content="user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, minimal-ui">
        <title>GraphQL Playground</title>
        <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
        <link rel="shortcut icon" href="//cdn.jsdelivr.net/npm/graphql-playground-react/build/favicon.png" />
        <script src="//cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
      </head>
      <body>
        <div id="root">
          <style>
            body {
              background-color: rgb(23, 42, 58);
              font-family: Open Sans, sans-serif;
              height: 90vh;
            }
            #root {
              height: 100%;
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .loading {
              font-size: 32px;
              font-weight: 200;
              color: rgba(255, 255, 255, .6);
              margin-left: 20px;
            }
            img {
              width: 78px;
              height: 78px;
            }
            .title {
              font-weight: 400;
            }
          </style>
          <img src='//cdn.jsdelivr.net/npm/graphql-playground-react/build/logo.png' alt=''>
          <div class="loading"> Loading
            <span class="title">GraphQL Playground</span>
          </div>
        </div>
        <script>
          window.addEventListener('load', function (event) {
            GraphQLPlayground.init(document.getElementById('root'), ${settingsString})
          });
        </script>
      </body>
      </html>
    `);
  });
}
