import { useEffect, useReducer, useState } from 'react';

import { css } from '@emotion/react';
import sortBy from 'lodash/sortBy';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import { SelectableList } from '../list/SelectableList';
import useList from '../list/useList';
import Renderer from '../slate/Renderer';
import useWorkflow from '../workflow/useWorkflow';

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

  overflow-wrap: break-word;

  h2 {
    font-size: 0.9em;
    font-weight: 400;
  }
`;

function DumpWorkflow({ id }: { id: string }) {
  const { workflow } = useWorkflow(id, 'cache-first');
  if (!workflow) {
    return <LoadingSpinner name="dump workflow" />;
  }
  return (
    <ContentCard title={workflow.name} css={dumpWrapper}>
      <Renderer contents={workflow.contents} />
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

export default function DumpWorkflows() {
  const { collections, loading, forceSync } = useList();
  useEffect(() => {
    forceSync();
    // We only want to run this on first load of this component, not every time forceSync changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [sliceCount, incrementCount] = useReducer((c) => c + 10, 10);
  const canSliceMore = collections && sliceCount < collections.edges.length;
  useEffect(() => {
    if (canSliceMore) {
      const timer = window.setInterval(() => {
        incrementCount();
      }, 1000);
      return () => window.clearInterval(timer);
    }
  }, [canSliceMore]);

  if (!collections || loading) {
    return <LoadingSpinner name="dump workflows" />;
  }

  const contents = [];
  let i = 0;
  collections?.edges.forEach((e) => {
    contents.push(<h1 key={e.node.id}>{e.node.name}</h1>);
    const sortedStaticIds = sortBy(e.node.workflows.edges, (e) =>
      e.node.name.toLowerCase().replace(/[^a-z0-9 ]*/, '')
    ).map((e) => e.node.staticId);
    sortedStaticIds.forEach((id) => {
      <DumpWorkflow key={id} id={id} />;
    });
  });

  return (
    <SelectableList actionKeys={[]} scrollable={true}>
      <Counter sliceCount={sliceCount} totalCount={collections?.edges.length} />
      {collections?.edges.slice(0, sliceCount).map((collectionEdge) => (
        <div key={collectionEdge.node.id}>
          <h1>{collectionEdge.node.name}</h1>
          {sortBy(collectionEdge.node.workflows.edges, (e) =>
            e.node.name.toLowerCase().replace(/[^a-z0-9 ]*/, '')
          )
            .map((e) => e.node.staticId)
            .map((id) => (
              <DumpWorkflow key={id} id={id} />
            ))}
        </div>
      ))}
    </SelectableList>
  );
}
