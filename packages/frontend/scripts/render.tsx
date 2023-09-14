#!/usr/local/bin/npx ts-node

import '../src/global';

import ReactDOMServer from 'react-dom/server';

import Renderer from '../src/slate/Renderer';

// Fill this in
const BLOB: any[] = [];

declare global {
  namespace NodeJS {
    interface Global {
      window: Window;
    }
  }
}

export default function main() {
  try {
    const markup = ReactDOMServer.renderToStaticMarkup(
      <Renderer contents={BLOB[0].contents as any} />
    );
    console.log(markup);
  } catch (e) {
    console.error(e);
  }
}

main();
