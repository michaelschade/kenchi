import { useState } from 'react';

import { css } from '@emotion/react';

import { SecondaryButton } from '@kenchi/ui/lib/Button';
import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import PageContainer from '@kenchi/ui/lib/Dashboard/PageContainer';

import Renderer from '../../slate/Renderer';
import { startingContents } from '../../workflow/WorkflowEditor';
import { DataSourceVariablesProvider } from '../dataSources/useDataSourceVariables';
import { Widget } from './types';
import { WidgetEditor } from './WidgetEditor';

const WidgetsPage = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  return (
    <DataSourceVariablesProvider>
      <PageContainer width="xl" heading="Widgets">
        <div
          css={css`
            display: grid;
            gap: 1rem;
            grid-template-columns: 300px 1fr;
          `}
        >
          <div>
            <div
              css={css`
                display: grid;
                gap: 0.5rem;
                grid-template-columns: minmax(0, 1fr);
              `}
            >
              <SecondaryButton
                onClick={() => {
                  setWidgets([
                    ...widgets,
                    {
                      id: `widget-${widgets.length}`,
                      contents: startingContents,
                    },
                  ]);
                }}
              >
                + Add widget
              </SecondaryButton>
              {widgets.length > 0 && (
                <ContentCard fullBleed>
                  <div
                    css={css`
                      display: grid;
                      grid-template-columns: minmax(0, 1fr);
                    `}
                  >
                    {widgets.map((widget) => (
                      <div
                        key={widget.id}
                        css={({ colors }: KenchiTheme) =>
                          css`
                            display: grid;
                            gap: 0.5rem;
                            grid-template-columns: 1fr auto;
                            background-color: ${colors.gray[0]};
                            align-items: center;
                            padding: 0.5rem;
                            &:not(:last-of-type) {
                              border-bottom: 1px solid ${colors.gray[3]};
                            }
                          `
                        }
                      >
                        <Renderer contents={widget.contents} key={widget.id} />
                        <SecondaryButton
                          size="tiny"
                          onClick={() => setEditingWidgetId(widget.id)}
                        >
                          Edit
                        </SecondaryButton>
                      </div>
                    ))}
                  </div>
                </ContentCard>
              )}
            </div>
          </div>
          {editingWidgetId && (
            <div>
              <ContentCard fullBleed>
                <WidgetEditor
                  key={editingWidgetId}
                  widget={
                    widgets.find((widget) => widget.id === editingWidgetId)!
                  }
                  onChangeWidget={(updatedWidget) => {
                    setWidgets(
                      widgets.map((widget) => {
                        if (widget.id === updatedWidget.id) {
                          return updatedWidget;
                        }
                        return widget;
                      })
                    );
                  }}
                />
              </ContentCard>
            </div>
          )}
        </div>
      </PageContainer>
    </DataSourceVariablesProvider>
  );
};

export default WidgetsPage;
