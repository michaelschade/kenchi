import { css } from '@emotion/react';
import { faFileInvoice } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link as RouterLink } from 'react-router-dom';

import { WorkflowLinkElement } from '@kenchi/slate-tools/lib/types';
import { linkStyle } from '@kenchi/ui/lib/Text';

import useWorkflow from '../../workflow/useWorkflow';

const workflowLinkStyle = css`
  & {
    text-decoration: none !important;
  }

  &:hover {
    span {
      text-decoration: underline;
    }
  }
`;

type WorkflowLinkProps = {
  element: WorkflowLinkElement;
};

export default function WorkflowLink({
  element: { workflow: staticId },
}: WorkflowLinkProps) {
  const { loading, error, workflow } = useWorkflow(staticId, 'cache-first');

  let href, name;
  if (workflow) {
    href = `/playbooks/${workflow.staticId}`;
    name = workflow.name;
  } else if (error) {
    name = 'Error loading';
  } else if (loading) {
    name = 'Loading...';
  } else {
    name = 'Playbook not found';
  }

  const icon = (
    <FontAwesomeIcon
      icon={faFileInvoice}
      size="sm"
      style={{ opacity: '0.7' }}
    />
  );
  const body = (
    <>
      {icon} <span>{name}</span>
    </>
  );
  if (href) {
    return (
      <RouterLink
        css={[
          (theme) => linkStyle(theme, { underline: false }),
          workflowLinkStyle,
        ]}
        to={href}
      >
        {body}
      </RouterLink>
    );
  } else {
    return (
      <span
        css={[
          (theme) => linkStyle(theme, { underline: false }),
          workflowLinkStyle,
        ]}
      >
        {body}
      </span>
    );
  }
}
