import { useEffect, useReducer, useState } from 'react';

import { css } from '@emotion/react';
import sortBy from 'lodash/sortBy';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import { SelectableList } from '../list/SelectableList';
import useList, { useFlatList } from '../list/useList';
import useRunTool from '../tool/useRunTool';
import useTool from '../tool/useTool';
import { isTool } from '../utils/versionedNode';

const hideOnPrintStyle = css`
  @media print {
    & {
      display: none;
    }
  }
`;

const dumpWrapper = css`
  page-break-after: always;
  page-break: after;
  position: relative;
  max-width: 600px;
  margin-bottom: 10px;

  @media print {
    max-width: 100%;
  }

  overflow-wrap: break-word;

  h2 {
    font-size: 0.9em;
    font-weight: 400;
  }
`;

function ToolPreview({ tool }: any) {
  const [, { getPreview }] = useRunTool(tool, {});
  return <>{getPreview()}</>;
}

function DumpTool({ id }: { id: string }) {
  const { tool } = useTool(id, 'cache-first');
  if (!tool) {
    return <LoadingSpinner name="dump tool" />;
  }
  return (
    <ContentCard
      title={`${tool.collection.name} - ${tool.name}`}
      css={dumpWrapper}
    >
      <ToolPreview tool={tool} />
    </ContentCard>
  );
}

function Counter({
  sliceCount,
  totalCount,
}: {
  sliceCount: number;
  totalCount: number;
}) {
  const [spinners, setSpinners] = useState(1);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSpinners(
        document.querySelectorAll('[data-icon="circle-notch"]').length
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isDone = sliceCount > totalCount && spinners === 0;
  useEffect(() => {
    if (isDone) {
      // Give an extra second for the layout to settle
      window.setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [isDone]);

  return (
    <ContentCard css={[dumpWrapper, hideOnPrintStyle]}>
      {isDone ? (
        <>Loading appears to be done...printing!</>
      ) : (
        <>
          Loading {Math.min(sliceCount, totalCount)} of {totalCount}, prepare
          for your computer to be slow! {spinners} spinners spinning.
        </>
      )}
    </ContentCard>
  );
}

export default function DumpTools() {
  const { collections, loading, forceSync } = useList();
  useEffect(() => {
    forceSync();
    // We only want to run this on first load of this component, not every time forceSync changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const data = useFlatList(collections, isTool);

  const [sliceCount, incrementCount] = useReducer((c) => c + 10, 10);
  const canSliceMore = data && sliceCount < data.length;
  useEffect(() => {
    if (canSliceMore) {
      const timer = window.setInterval(() => {
        incrementCount();
      }, 1000);
      return () => window.clearInterval(timer);
    }
  }, [canSliceMore]);

  if (!data || loading) {
    return <LoadingSpinner name="dump tools" />;
  }

  const sortedStaticIds = sortBy(data, (t) =>
    `${t.collection.name} - ${t.name}`.toLowerCase().replace(/[^a-z ]*/, '')
  ).map((w) => w.staticId);
  return (
    <SelectableList actionKeys={[]} scrollable={true}>
      <Counter sliceCount={sliceCount} totalCount={data.length} />
      {sortedStaticIds.slice(0, sliceCount).map((id) => (
        <DumpTool key={id} id={id} />
      ))}
    </SelectableList>
  );
}
