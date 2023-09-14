import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { css } from '@emotion/react';
import capitalize from 'lodash/capitalize';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { PreloadedTable } from '@kenchi/ui/lib/Dashboard/Table';
import { ContentCardTabs } from '@kenchi/ui/lib/Dashboard/Tabs';
import { Input } from '@kenchi/ui/lib/Form';
import { TextWithHighlight } from '@kenchi/ui/lib/TextWithHighlight';
import Tooltip from '@kenchi/ui/lib/Tooltip';

import { DataSourceVariable } from '../../dashboard/dataSources/types';
import useFuse from '../../list/useFuse';

export type DataSourceVariablesExplorerRef = {
  onKeyDown: (e: React.KeyboardEvent) => void;
};

type PropsForDataSourceVariablesExplorer = {
  onSelectVariable: (variable: DataSourceVariable) => void;
  textFilterValue: string;
  onChangeTextFilterValue?: (value: string) => void;
  onFakeFocusVariable?: (variable: DataSourceVariable) => void;
  shouldShowSearch?: boolean;
  variables: Record<string, DataSourceVariable>;
  fakeFocusedVariable?: DataSourceVariable | null;
};

export const DataSourceVariablesExplorer = forwardRef(
  (
    {
      onSelectVariable,
      textFilterValue,
      onChangeTextFilterValue,
      onFakeFocusVariable,
      shouldShowSearch = false,
      variables,
      fakeFocusedVariable,
    }: PropsForDataSourceVariablesExplorer,
    ref: React.Ref<DataSourceVariablesExplorerRef>
  ) => {
    const typesOfDataSourceVariables = Object.values(variables).reduce(
      (acc, variable) => {
        if (!acc.includes(variable.type)) {
          acc.push(variable.type);
        }
        return acc;
      },
      [] as string[]
    );
    const rowRefs = useRef<Record<string, HTMLTableRowElement>>({});

    const [tabValue, setTabValue] = useState('all');

    const variablesForTab = useMemo(() => {
      if (tabValue === 'all') {
        return Object.values(variables);
      }
      return Object.values(variables).filter(
        (variable) => variable.type === tabValue
      );
    }, [tabValue, variables]);

    const variablesForSearchTerm = useFuse(variablesForTab, textFilterValue, {
      keys: [
        {
          name: 'path',
          getFn: (variable: DataSourceVariable) => variable.path.join('.'),
          weight: 1,
        },
        {
          name: 'value',
          weight: 0.5,
        },
      ],
      limit: 50,
    }).map((result) => result.item);

    useEffect(() => {
      if (variablesForSearchTerm.length > 0 && !fakeFocusedVariable) {
        onFakeFocusVariable?.(variablesForSearchTerm[0]);
      }
    }, [fakeFocusedVariable, onFakeFocusVariable, variablesForSearchTerm]);

    useEffect(() => {
      if (!fakeFocusedVariable) {
        return;
      }
      const rowElem = rowRefs.current[fakeFocusedVariable.id];
      if (rowElem) {
        rowElem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }, [fakeFocusedVariable]);

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown(event) {
          switch (event.key) {
            case 'ArrowDown':
              event.preventDefault();
              if (variablesForSearchTerm.length > 0) {
                const indexOfFakeFocusedVariable = fakeFocusedVariable
                  ? variablesForSearchTerm.indexOf(fakeFocusedVariable)
                  : -1;
                const variableToFakeFocus =
                  variablesForSearchTerm[indexOfFakeFocusedVariable + 1];
                onFakeFocusVariable?.(variableToFakeFocus);
              }
              break;
            case 'ArrowUp':
              event.preventDefault();
              if (variablesForSearchTerm.length > 0) {
                const indexOfFakeFocusedVariable = fakeFocusedVariable
                  ? variablesForSearchTerm.indexOf(fakeFocusedVariable)
                  : -1;
                const variableToFakeFocus =
                  variablesForSearchTerm[
                    indexOfFakeFocusedVariable
                      ? indexOfFakeFocusedVariable - 1
                      : 0
                  ];
                onFakeFocusVariable?.(variableToFakeFocus);
              }
              break;
            default:
              break;
          }
        },
      }),
      [fakeFocusedVariable, onFakeFocusVariable, variablesForSearchTerm]
    );

    return (
      <div
        css={({ colors }: KenchiTheme) => css`
          background-color: ${colors.gray[0]};
        `}
      >
        <div
          css={css`
            display: grid;
            grid-auto-flow: column;
            align-items: end;
          `}
        >
          <ContentCardTabs
            options={[
              {
                label: 'All',
                value: 'all',
                count: Object.keys(variables).length,
              },
              ...typesOfDataSourceVariables.map((type) => ({
                label: capitalize(type),
                value: type,
                count: Object.values(variables).filter(
                  (variable) => variable.type === type
                ).length,
              })),
            ]}
            value={tabValue}
            onChange={setTabValue}
          />
          <div
            css={({ colors }: KenchiTheme) => css`
              border-bottom: 2px solid ${colors.gray[6]};
              padding: 0 0.25rem;
              display: grid;
              height: 100%;
              align-items: center;
            `}
          >
            {shouldShowSearch && onChangeTextFilterValue && (
              <Input
                type="search"
                design="condensed"
                css={css`
                  font-size: 0.875rem;
                `}
                value={textFilterValue}
                onChange={(e) => onChangeTextFilterValue(e.target.value)}
                autoFocus={true}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectVariable(variablesForSearchTerm[0]);
                  }
                }}
              />
            )}
          </div>
        </div>
        <div
          css={css`
            max-height: 20rem;
            overflow: auto;
            .left-ellipsis {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 10rem;
              max-width: 10rem;
              direction: rtl;
              text-align: right;
            }
          `}
        >
          <PreloadedTable
            data={variablesForSearchTerm}
            rowsPerPage={100}
            rowRender={(dataSourceVariable) => (
              <tr
                ref={(elem) => {
                  if (!elem) {
                    return;
                  }
                  rowRefs.current[dataSourceVariable.id] = elem;
                }}
                onClick={() => onSelectVariable(dataSourceVariable)}
                key={dataSourceVariable.id}
                data-fake-focused={fakeFocusedVariable === dataSourceVariable}
                css={({ colors }: KenchiTheme) => css`
                  font-family: source-code-pro, Menlo, Monaco, Consolas,
                    'Courier New', monospace;
                  font-size: 0.8rem;
                  cursor: pointer;
                  &[data-fake-focused='true'],
                  &:hover {
                    background-color: ${colors.accent[4]} !important;
                  }
                  &[data-fake-focused='true'] {
                    box-shadow: 0 1px 0px 1px ${colors.accent[8]},
                      0 -1px 0px 1px ${colors.accent[8]};
                  }
                `}
              >
                <Tooltip
                  placement="top"
                  overlay={dataSourceVariable.path.join('.')}
                >
                  <td className="left-ellipsis">
                    {dataSourceVariable.path.length > 1 && (
                      <span
                        css={({ colors }: KenchiTheme) =>
                          css`
                            color: ${colors.gray[10]};
                          `
                        }
                      >
                        <TextWithHighlight
                          text={dataSourceVariable.path.slice(0, -1).join('.')}
                          partToHighlight={textFilterValue}
                        />
                        .
                      </span>
                    )}
                    <span
                      css={({ colors }: KenchiTheme) => css`
                        font-weight: 600;
                        color: ${colors.gray[12]};
                      `}
                    >
                      <TextWithHighlight
                        text={dataSourceVariable.path.at(-1)!.toString()}
                        partToHighlight={textFilterValue}
                      />
                    </span>
                  </td>
                </Tooltip>
                <td
                  css={css`
                    text-align: right;
                    max-width: 8rem;
                  `}
                >
                  <span
                    css={({ colors }: KenchiTheme) => css`
                      transition: color 150ms ease-in-out;
                      color: ${colors.gray[10]};
                    `}
                  >
                    {dataSourceVariable.value}
                  </span>
                </td>
              </tr>
            )}
          />
        </div>
      </div>
    );
  }
);
