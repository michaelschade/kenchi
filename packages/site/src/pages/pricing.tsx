import React from 'react';

import { PageProps } from 'gatsby';

import BaseLayout from '../components/BaseLayout';
import { Footer } from '../components/Footer';
import { ShapesRow } from '../components/ShapesRow';
import { TopNav } from '../components/TopNav';
import Customers from '../pricing/Customers';
import FAQ from '../pricing/FAQ';
import { plans } from '../pricing/plans';
import { PlansSection } from '../pricing/PlansSection';
import { PricingCTASection } from '../pricing/PricingCTASection';
import { PricingTableSection } from '../pricing/PricingTable';

export default function Pricing({ location }: PageProps) {
  return (
    <BaseLayout
      title="Pricing - Kenchi"
      description="Pricing built for your organization’s needs."
    >
      <TopNav location={location} theme="light" />
      <PlansSection />
      <PricingTableSection plans={plans} />
      <Customers />
      <FAQ />
      <PricingCTASection />
      <ShapesRow />
      <Footer location={location} />
    </BaseLayout>
  );
}
