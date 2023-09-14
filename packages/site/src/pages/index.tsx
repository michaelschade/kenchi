/// <reference types="@emotion/react/types/css-prop" />
import React, { useEffect } from 'react';

import styled from '@emotion/styled';
import { PageProps } from 'gatsby';

import BaseLayout from '../components/BaseLayout';
import { BaseSection } from '../components/BaseSection';
import { Footer } from '../components/Footer';
import { TopNav } from '../components/TopNav';
import Customers from '../index/Customers';
import Features from '../index/Features';
import Hero from '../index/Hero';
import { Integrations } from '../index/Integrations';

const Testimonial = styled(BaseSection)``;
const CTA = styled(BaseSection)``;

export default function Home({ location }: PageProps) {
  useEffect(() => {
    // This is a hack to re-implement scrolling to fragment identifiers. We need
    // this because gsap breaks the browser's native behavior for that when used
    // in combination with scroll-behavior: smooth.
    setTimeout(() => {
      const hash = location.hash.replace('#', '');
      document.getElementById(hash)?.scrollIntoView();
    }, 100);
  }, [location.hash]);

  return (
    <BaseLayout>
      <TopNav location={location} />
      <Hero />
      <Customers />
      <Features />
      <Integrations />
      <Testimonial />
      <CTA />
      <Footer location={location} />
    </BaseLayout>
  );
}
