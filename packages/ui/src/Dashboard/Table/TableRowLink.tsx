import React from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useHistory } from 'react-router-dom';
import tw from 'twin.macro';

import { KenchiTheme } from '../../Colors';
import { isExternal } from '../../UnstyledLink';

const TableRow = styled.tr`
  cursor: pointer;
  font-size: 0.875rem;
`;

export const TableRowLink = React.forwardRef(
  (
    {
      children,
      to,
      className,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
      to: string;
    },
    ref: React.Ref<HTMLTableRowElement>
  ) => {
    const history = useHistory();
    const onClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey || isExternal(to)) {
        window.open(to, '_blank');
      } else {
        history.push(to);
      }
    };

    return (
      <TableRow
        className={className ? `${className} group` : 'group'}
        onClick={onClick}
        ref={ref}
        {...props}
      >
        {children}
        <td css={tw`text-right`}>
          <span
            css={({ colors }: KenchiTheme) =>
              css`
                ${tw`invisible group-hover:visible`}
                color: ${colors.accent[9]};
              `
            }
          >
            <FontAwesomeIcon icon={faChevronRight} size="sm" />
          </span>
        </td>
      </TableRow>
    );
  }
);
