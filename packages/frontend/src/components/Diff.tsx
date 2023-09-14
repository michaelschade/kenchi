import { useEffect, useMemo, useRef } from 'react';

import { ApolloProvider, useApolloClient } from '@apollo/client';
import { css } from '@emotion/react';
import { renderToStaticMarkup } from 'react-dom/server';
import tw from 'twin.macro';
import { visualDomDiff } from 'visual-dom-diff';
import { diffText } from 'visual-dom-diff/lib/util';

import { SlateNode } from '@kenchi/slate-tools/lib/types';
import { deserialize as deserializeSlate } from '@kenchi/slate-tools/lib/utils';
import { KenchiTheme } from '@kenchi/ui/lib/Colors';

import { ToolFragment, WorkflowFragment } from '../graphql/generated';
import Renderer, { RenderOpts } from '../slate/Renderer';
import { SlateComponentsForStaticRender } from '../slate/SlateComponentsForStaticRender';

const diffStyle = ({ colors }: KenchiTheme) => css`
  .vdd-added {
    ${tw`bg-opacity-20 transition-all`}
    background-color: ${colors.green[6]};
    &:hover {
      ${tw`bg-opacity-10`}
    }
  }

  .vdd-modified {
    ${tw`bg-opacity-20 transition-all`}
    background-color: ${colors.accent[7]};
    &:hover {
      ${tw`bg-opacity-10`}
    }
  }

  .vdd-removed {
    ${tw`bg-opacity-20 line-through transition-all`}
    background-color: ${colors.red[6]};
    &:hover {
      ${tw`bg-opacity-10 no-underline`}
    }
  }

  .vdd-removed img,
  img.vdd-removed {
    ${tw`opacity-60 transition-all`}
  }
  .vdd-removed:hover img,
  img.vdd-removed:hover {
    ${tw`opacity-100`}
  }
`;

enum DiffTypeEnum {
  UNCHANGED = 0,
  ADDED = 1,
  REMOVED = -1,
}

export function TextOldToNew({ from, to }: { from?: string; to?: string }) {
  if (from === to) {
    return <>{to}</>;
  }

  return (
    <div css={diffStyle}>
      <ins className="vdd-removed">{from || <em>(blank)</em>}</ins>
      <del className="vdd-added">{to || <em>(blank)</em>}</del>
    </div>
  );
}

export function TextDiff({ from, to }: { from: string; to: string }) {
  /*
  if (from === to) {
    return null;
  }
   */
  const diffList = diffText(from, to);
  return (
    <span css={diffStyle}>
      {diffList.map(([type, value], i) => {
        switch (type) {
          case DiffTypeEnum.UNCHANGED:
            return value;
          case DiffTypeEnum.ADDED:
            return (
              <ins key={i} className="vdd-added">
                {value}
              </ins>
            );
          case DiffTypeEnum.REMOVED:
            return (
              <del key={i} className="vdd-removed">
                {value}
              </del>
            );
          default:
            throw new Error(`Unexpected diff type ${type}`);
        }
      })}
    </span>
  );
}

export function ListDiff({
  from = [],
  to = [],
}: {
  from?: string[];
  to?: string[];
}) {
  const allItems = Array.from(new Set([...from, ...to])).sort();
  const diffItem = (item: string, i: number) => {
    if (to.includes(item) && !from.includes(item)) {
      return (
        <li key={i}>
          <ins className="vdd-added">{item}</ins>
        </li>
      );
    } else if (!to.includes(item) && from.includes(item)) {
      return (
        <li key={i}>
          <del className="vdd-removed">{item}</del>
        </li>
      );
    } else {
      return <li key={i}>{item}</li>;
    }
  };
  return <ul css={diffStyle}>{allItems.map(diffItem)}</ul>;
}

const VDD_SELECTOR = '.vdd-added, .vdd-removed, .vdd-modified';

const renderOpts: RenderOpts = {
  singleLine: false,
  insertText: false,
  voidWrap: true,
};

export function SlateDiff({
  from,
  to,
  hideUnchanged,
}: {
  from: SlateNode[];
  to: SlateNode[];
  hideUnchanged?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const client = useApolloClient();
  const contentDiff = useMemo(() => {
    const fromDiv = document.createElement('div');
    fromDiv.innerHTML = renderToStaticMarkup(
      <ApolloProvider client={client}>
        <SlateComponentsForStaticRender
          slateNodes={from}
          slateRenderOpts={renderOpts}
        />
      </ApolloProvider>
    );

    const toDiv = document.createElement('div');
    toDiv.innerHTML = renderToStaticMarkup(
      <ApolloProvider client={client}>
        <SlateComponentsForStaticRender
          slateNodes={to}
          slateRenderOpts={renderOpts}
        />
      </ApolloProvider>
    );

    return visualDomDiff(fromDiv, toDiv);
  }, [client, from, to]);

  useEffect(() => {
    if (contentDiff && ref.current) {
      if (hideUnchanged) {
        // Remove any top-level DOM element where the children within haven't
        // changed.
        for (const child of contentDiff.children[0].children) {
          if (
            !child.matches(VDD_SELECTOR) &&
            !child.querySelector(VDD_SELECTOR)
          ) {
            // TODO: maybe put a `...` to help signal or a different React
            // element so we can style it (and then support click to expand)
            (child as HTMLElement).style.display = 'none';
          }
        }
      }
      ref.current.innerHTML = '';
      ref.current.appendChild(contentDiff);
    }
  }, [hideUnchanged, contentDiff, ref]);

  return <div ref={ref} css={diffStyle} />;
}

export function WorkflowDiff({
  from,
  to,
}: {
  from?: WorkflowFragment | null;
  to: WorkflowFragment;
}) {
  let preview;
  if (from) {
    //description = <TextDiff from={from.description} to={to.description} />;
    preview = <SlateDiff from={from.contents} to={to.contents} hideUnchanged />;
  } else {
    //description = to.description;
    preview = <Renderer contents={to.contents} {...renderOpts} />;
  }
  return <>{preview}</>;
}

export function ToolDiff({
  from,
  to,
}: {
  from?: ToolFragment | null;
  to: ToolFragment;
}) {
  if (to.component !== 'GmailAction') {
    return (
      <>
        Unable to generate a list of changes for this suggestion, please talk to
        the author and review it together.
      </>
    );
  }
  let preview;
  if (from) {
    const fromConfig = deserializeSlate(from.configuration.data);
    const toConfig = deserializeSlate(to.configuration.data);
    //description = <TextDiff from={from.description} to={to.description} />;
    preview = <SlateDiff from={fromConfig} to={toConfig} />;
  } else {
    //description = to.description;
    const config = deserializeSlate(to.configuration.data);
    preview = <Renderer contents={config} {...renderOpts} />;
  }
  return (
    <>
      <dt>Text to insert</dt>
      {preview}
    </>
  );
}
