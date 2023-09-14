import React, { ReactNode, useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as AccordionPrimitive from '@radix-ui/react-accordion';

import { BrandColors } from '@kenchi/ui/lib/Colors';

const AccordionRoot = styled(AccordionPrimitive.Root)`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
`;

const AccordionTrigger = styled(AccordionPrimitive.Trigger)`
  background-color: transparent;
  align-items: baseline;
  border: none;
  color: ${BrandColors.black};
  display: grid;
  font-size: 1.5rem;
  gap: 1rem;
  grid-template-columns: auto minmax(0, 1fr);
  line-height: 1.3;
  padding: 0;
  text-align: left;
  transition: color 0.1s ease-in-out;
  width: 100%;
  outline: none;
  position: relative;
`;

const AccordionContent = styled(AccordionPrimitive.Content)`
  @keyframes open-accordion {
    from {
      height: 0;
    }
    to {
      height: var(--radix-accordion-content-height);
    }
  }

  @keyframes close-accordion {
    from {
      height: var(--radix-accordion-content-height);
    }
    to {
      height: 0;
    }
  }

  &[data-state='open'] {
    animation: open-accordion 150ms ease;
  }

  &[data-state='closed'] {
    animation: close-accordion 150ms ease;
  }

  padding-left: 2rem;
  overflow: hidden;
`;

export type AccordionSection = {
  label: ReactNode;
  content: ReactNode;
  key: string;
};

type AccordionProps = {
  sections: AccordionSection[];
  openSections?: string[];
  onOpenSection?: (key: string) => void;
};

export const Accordion = ({
  sections,
  openSections: openSectionsProp = [],
  onOpenSection,
}: AccordionProps) => {
  const [openSections, setOpenSections] = useState<string[]>(openSectionsProp);
  return (
    <AccordionRoot
      type="multiple"
      value={openSections}
      onValueChange={(openSectionsAfterChange) => {
        const newlyOpenSections = openSectionsAfterChange.filter(
          (key) => !openSections.includes(key)
        );
        newlyOpenSections.forEach((key) => {
          onOpenSection?.(key);
        });
        setOpenSections(openSectionsAfterChange);
      }}
    >
      {sections.map(({ label, content, key }) => (
        <AccordionPrimitive.Item key={key} value={key}>
          <AccordionPrimitive.Header>
            <AccordionTrigger>
              <FontAwesomeIcon
                icon={faChevronDown}
                css={css`
                  transform: rotate(
                    ${openSections.includes(key) ? '0deg' : '-90deg'}
                  );
                  transition: transform 150ms ease;
                `}
                size="xs"
              />
              {label}
            </AccordionTrigger>
          </AccordionPrimitive.Header>
          <AccordionContent>{content}</AccordionContent>
        </AccordionPrimitive.Item>
      ))}
    </AccordionRoot>
  );
};
