import styled from '@emotion/styled';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

export const Collapsible = CollapsiblePrimitive.Root;

export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

export const CollapsibleContent = styled(CollapsiblePrimitive.Content)`
  @keyframes collapsible-content-open {
    from {
      height: 0;
      opacity: 0;
      overflow: hidden;
    }
    to {
      height: var(--radix-collapsible-content-height);
      opacity: 1;
      overflow: hidden;
    }
  }

  @keyframes collapsible-content-close {
    from {
      height: var(--radix-collapsible-content-height);
      opacity: 1;
      overflow: hidden;
    }
    to {
      height: 0;
      opacity: 0;
      overflow: hidden;
    }
  }

  overflow: visible;

  &[data-state='open'] {
    animation: collapsible-content-open 150ms ease-out;
  }
  &[data-state='closed'] {
    animation: collapsible-content-close 150ms ease-in;
  }
`;
