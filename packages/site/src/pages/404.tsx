import React from 'react';

import styled from '@emotion/styled';
import { Helmet } from 'react-helmet';

import BaseLayout from '../components/LegacyBaseLayout';

const Copy = styled.div`
  display: grid;
  row-gap: var(--rowGap);

  a {
    font-weight: var(--fontWeightSemibold);
  }
`;

export default function NotFound() {
  return (
    <BaseLayout>
      <Helmet>
        <title>404 not found :( - Kenchi</title>
      </Helmet>
      <Copy>
        <h1>Page Not Found</h1>
        <p>
          We&rsquo;re super sorry, but we can&rsquo;t find what you&rsquo;re
          looking for. Try <a href="/">heading back to our homepage</a>.
        </p>
      </Copy>
    </BaseLayout>
  );
}
