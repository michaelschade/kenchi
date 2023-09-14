import { ReactNode, useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as AccordionPrimitive from '@radix-ui/react-accordion';

const AccordionTrigger = styled(AccordionPrimitive.Trigger)`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.gray[0]};
  border: none;
  box-shadow: 0 0 1px ${({ theme }) => theme.colors.gray[9]};
  color: ${({ theme }) => theme.colors.gray[11]};
  display: grid;
  font-size: 1rem;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 0.5rem;
  text-align: left;
  transition: color 0.1s ease-in-out;
  width: 100%;
  outline: none;
  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.colors.gray[12]};
  }
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

  overflow: hidden;
`;

type AccordionSection = {
  label: ReactNode;
  content: ReactNode;
  key: string;
};

type AccordionProps = {
  sections: AccordionSection[];
  openSections?: string[];
};

export const Accordion = ({
  sections,
  openSections: openSectionsProp = [],
}: AccordionProps) => {
  const [openSections, setOpenSections] = useState<string[]>(openSectionsProp);
  return (
    <AccordionPrimitive.Root
      type="multiple"
      value={openSections}
      onValueChange={setOpenSections}
    >
      {sections.map(({ label, content, key }) => (
        <AccordionPrimitive.Item key={key} value={key}>
          <AccordionPrimitive.Header>
            <AccordionTrigger>
              {label}
              <FontAwesomeIcon
                icon={faChevronDown}
                css={css`
                  transform: rotate(
                    ${openSections.includes(key) ? '0deg' : '90deg'}
                  );
                  transition: transform 150ms ease;
                `}
              />
            </AccordionTrigger>
          </AccordionPrimitive.Header>
          <AccordionContent>{content}</AccordionContent>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
};
