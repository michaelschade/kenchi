import { css, useTheme } from '@emotion/react';
import { useFocused, useSelected } from 'slate-react';

import { VariableElement } from '@kenchi/slate-tools/lib/types';

import useVariable from '../../tool/useVariable';

type EditorVariableProps = {
  attributes?: Record<string, any>;
  children: React.ReactNode;
  element: VariableElement;
};

export const placeholderStyle = css`
  color: hsla(332deg 90% 70%);
`;

export function EditorVariable({
  attributes,
  children,
  element,
}: EditorVariableProps) {
  const selected = useSelected();
  const focused = useFocused();
  const { colors } = useTheme();
  return (
    <span
      {...attributes}
      contentEditable={false}
      style={{
        padding: '3px 3px 2px',
        margin: '0 1px',
        verticalAlign: 'baseline',
        display: 'inline-block',
        borderRadius: '4px',
        backgroundColor: colors.gray[4],
        fontSize: '0.9em',
        boxShadow:
          selected && focused ? `0 0 0 2px ${colors.accent[8]}` : 'none',
      }}
    >
      {element.placeholder}
      {children}
    </span>
  );
}

export default function Variable({ element }: { element: VariableElement }) {
  const key = `${element.source}:${element.id}`;
  const variable = useVariable(key);

  if (variable !== undefined && variable !== null) {
    if (variable.indexOf('\n') !== -1) {
      return (
        <>
          {variable
            .split('\n')
            .flatMap((v, i) => (i === 0 ? v : [<br key={i} />, v]))}
        </>
      );
    } else {
      return <>{variable}</>;
    }
  } else {
    return <code css={placeholderStyle}>{element.placeholder}</code>;
  }
}
