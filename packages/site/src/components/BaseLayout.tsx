import React from 'react';

import { Helmet } from 'react-helmet';

import opengraphImg from './opengraphImg.png';

type BaseLayoutProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
};

const DEFAULT_TITLE = 'Snippets, playbooks, & data at your fingertips - Kenchi';
const DEFAULT_DESCRIPTION =
  'Kenchi is a privacy-first Chrome extension that supercharges your support tools. As a single source of truth, Kenchi reduces cognitive load, fosters collaboration across your whole team, and generates precise insights about your support conversations.';

const BaseLayout = ({
  children,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: BaseLayoutProps) => {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta
          property="og:image"
          name="og:image"
          content={`https://kenchi.com${opengraphImg}`}
        />

        <meta name="og:url" content="https://kenchi.com/" />
        <meta name="twitter:site" content="@getkenchi" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content={`https://kenchi.com${opengraphImg}`}
        />

        <link rel="icon" href="/faviconLarge.png" />
        <link rel="apple-touch-icon" href="/faviconLarge.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Helmet>
      {children}
    </>
  );
};

export default BaseLayout;
