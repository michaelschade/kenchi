import React from 'react';

import { PageProps } from 'gatsby';

import { ChangelogSection } from '../changelog/Changelog';
import BaseLayout from '../components/BaseLayout';
import { Footer } from '../components/Footer';
import { TopNav } from '../components/TopNav';

export default function Changelog({ location }: PageProps) {
  return (
    <BaseLayout
      title="Changelog - Kenchi"
      description="Keep up with the latest in Kenchi-land."
    >
      <TopNav location={location} theme="light" />
      <ChangelogSection />
      <Footer location={location} />
    </BaseLayout>
  );
}
