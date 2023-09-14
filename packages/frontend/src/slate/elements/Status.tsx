import styled from '@emotion/styled';
import classNames from 'classnames/bind';
import { Transforms } from 'slate';
import { ReactEditor, useFocused, useSelected, useSlate } from 'slate-react';

import { StatusElement } from '@kenchi/slate-tools/lib/types';
import Emoji from '@kenchi/ui/lib/Emoji';
import { PickerButton } from '@kenchi/ui/lib/EmojiPicker';

const StatusDiv = styled.div`
  > .picker > button {
    display: inline-block;
  }
`;

export function StatusEditor({
  attributes,
  children,
  element,
}: {
  attributes?: Record<string, unknown>;
  children: React.ReactNode;
  element: StatusElement;
}) {
  const selected = useSelected();
  const focused = useFocused();
  const editor = useSlate();
  const path = ReactEditor.findPath(editor, element);

  // TODO: tab management

  const updateIcon = (icon: string) => {
    Transforms.setNodes<StatusElement>(editor, { icon }, { at: path });
  };

  return (
    <StatusDiv
      className={classNames({ active: selected && focused })}
      {...attributes}
    >
      <span className="picker" contentEditable={false}>
        <PickerButton onSelect={updateIcon} initialEmoji={element.icon} />
      </span>
      {children}
    </StatusDiv>
  );
}

export function StatusValue({
  element,
  children,
}: {
  element: StatusElement;
  children: React.ReactNode;
}) {
  return (
    <>
      {element.icon && <Emoji emoji={element.icon} />} {children}
    </>
  );
}
