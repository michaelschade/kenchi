import { forwardRef } from 'react';

import { css } from '@emotion/react';
import {
  faGripLinesVertical,
  faPencil,
  faPlus,
  faTimes,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';

const styles = ({ colors }: KenchiTheme) => css`
  ${tw`flex items-center`}

  &.isDragging {
    ${tw`opacity-20`}
  }

  .card {
    ${tw`flex flex-grow rounded px-2 py-1`}
    /* Add base border styles to overcome lack of preflight */
    border: 2px solid ${colors.accent[5]};
    background-color: ${colors.gray[1]};
    color: ${colors.gray[12]};
  }
  .handle {
    ${tw`-ml-2 px-0.5`}
    color: ${colors.accent[7]};
  }
  .action {
    color: ${colors.accent[7]};
  }
  .action {
    ${tw`cursor-pointer`}
    &:hover {
      color: ${colors.accent[9]};
    }
    &:active {
      color: ${colors.accent[10]};
    }
  }

  &.draggable:hover {
    cursor: grab;
    .card {
      border-color: ${colors.accent[8]};
    }
    .handle {
      color: ${colors.accent[8]};
    }
  }
  &.draggable:active {
    cursor: grabbing;
    .card {
      border-color: ${colors.accent[9]};
    }
    .handle {
      color: ${colors.accent[9]};
    }
  }
  &.editing {
    .card {
      border-color: ${colors.accent[8]};
    }
  }
  &.error {
    .card {
      border-color: ${colors.red[9]};
    }
  }
  &.error:hover {
    .card {
      border-color: ${colors.red[9]};
    }
  }
  .card {
    ${tw`flex space-x-2`}
  }
  .label {
    ${tw`flex-grow`}
  }
`;

type Props = {
  label: React.ReactNode;
  onAdd?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
  draggable?: boolean;
  isDragging?: boolean;
  editing?: boolean;
  error?: boolean;

  previewRef?: React.Ref<HTMLDivElement>;
};

export const ActionableItem = forwardRef(
  (
    {
      label,
      draggable,
      isDragging,
      editing,
      onAdd,
      onRemove,
      onEdit,
      error,
      previewRef,
    }: Props,
    ref: React.Ref<HTMLDivElement>
  ) => {
    return (
      <div
        ref={ref}
        css={styles}
        className={classNames({
          draggable,
          isDragging,
          editing,
          error,
        })}
      >
        <div ref={previewRef} className="card">
          {draggable && (
            <div className="handle">
              <FontAwesomeIcon icon={faGripLinesVertical} />
            </div>
          )}
          <div className="label">{label}</div>
          <div
            className="action"
            onClick={(event) => {
              event.preventDefault();
              onEdit && onEdit();
            }}
          >
            {onEdit ? <FontAwesomeIcon fixedWidth icon={faPencil} /> : null}
          </div>
          <div
            className="action"
            onClick={(event) => {
              event.preventDefault();
              // TODO: in a perfect world these would be mutually exclusive
              onAdd && onAdd();
              onRemove && onRemove();
            }}
          >
            {onAdd ? <FontAwesomeIcon fixedWidth icon={faPlus} /> : null}
            {onRemove ? <FontAwesomeIcon fixedWidth icon={faTimes} /> : null}
          </div>
        </div>
      </div>
    );
  }
);
