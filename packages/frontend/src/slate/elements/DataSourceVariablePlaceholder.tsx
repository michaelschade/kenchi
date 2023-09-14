import { useTheme } from '@emotion/react';
import { useFocused, useSelected } from 'slate-react';

import { DataSourceVariableElement } from '@kenchi/slate-tools/lib/types';

type DataSourceVariablePlaceholderProps = {
  attributes?: Record<string, any>;
  children: React.ReactNode;
  element: DataSourceVariableElement;
};

export const DataSourceVariablePlaceholder = ({
  attributes,
  element,
  children,
}: DataSourceVariablePlaceholderProps) => {
  const selected = useSelected();
  const focused = useFocused();
  const { colors } = useTheme();
  return (
    <span
      {...attributes}
      contentEditable={false}
      style={{
        backgroundColor: colors.accent[6],
        borderRadius: '4px',
        boxShadow:
          selected && focused ? `0 0 0 2px ${colors.accent[8]}` : 'none',
        display: 'inline-block',
        fontFamily:
          "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
        fontSize: '0.875em',
        margin: '0 1px',
        padding: '3px 3px 2px',
        verticalAlign: 'baseline',
      }}
    >
      {element.placeholder}
      {children}
    </span>
  );
};
