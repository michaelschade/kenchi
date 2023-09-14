import { KenchiMessageRouter } from '@kenchi/commands';
import { ToolInput } from '@kenchi/slate-tools/lib/tool/types';

import { DomainSettingsQuery } from '../../../graphql/generated';
import DemoExtractor from './demo';
import DOMExtractor from './dom';
import FrontExtractor from './front';
import GmailExtractor from './gmail';
import { IntercomExtractor } from './intercom';
import ZendeskExtractor from './zendesk';

export interface ExtractorConstructor {
  new (args: Record<string, any>): Extractor;
}

export type Context = {
  url?: URL;
};

export type VariableListener = (variables: Record<string, any>) => void;

export type Variable = Omit<ToolInput, 'source'>;

export interface Extractor {
  initialize(
    messageRouter: KenchiMessageRouter<'app' | 'hud'>
  ): void | (() => void);
  setContext(context: Context): void;
  addListener(listener: VariableListener): void;
  getPossibleVariables(): Variable[];
}

const EXTRACTORS: Record<string, ExtractorConstructor> = {
  dom: DOMExtractor,
  front: FrontExtractor,
  gmail: GmailExtractor,
  intercom: IntercomExtractor,
  demo: DemoExtractor,
  zendesk: ZendeskExtractor,
};

export type AllPossibleVariables = Record<
  string,
  { domains: Set<string>; variables: Variable[] }
>;

export function getAllPossibleVariables(
  settings: DomainSettingsQuery
): AllPossibleVariables {
  const viewer = settings?.viewer;
  if (!viewer) {
    console.error('NO DATA');
    return {};
  }

  // Get extractors for each host so we resolve host-based overriding. For
  // example, if we have default extractors that expose more variables than
  // the organization one on the same host, we don't want to show the default
  // ones. This is probably overkill for now but a good reminder that we should
  // abstract out a sane set of "order of operations" for domain config.
  const hostExtractorMap: Record<string, [string, Record<string, Extractor>]> =
    {};
  viewer.defaultDomains.edges.forEach(({ node }) => {
    if (!node.variableExtractors) {
      return;
    }
    const extractors = createExtractors(node.variableExtractors);
    node.hosts.forEach((host) => {
      hostExtractorMap[host] = [node.name || host, { ...extractors }];
    });
  });
  if (viewer.organization) {
    // viewer.organization should only be null when not logged in
    viewer.organization.domains.edges.forEach(({ node }) => {
      if (!node.variableExtractors) {
        return;
      }
      const extractors = createExtractors(node.variableExtractors);
      node.hosts.forEach((host) => {
        const existingMap = hostExtractorMap[host]?.[1] || {};
        hostExtractorMap[host] = [
          node.name || host,
          { ...existingMap, ...extractors },
        ];
      });
    });
  }

  const rtn: AllPossibleVariables = {};
  Object.values(hostExtractorMap).forEach(([name, extractors]) => {
    // TODO: typechecking or something
    const variables = Object.values(extractors)
      .map((e) => e.getPossibleVariables())
      .flat();
    variables.forEach((v) => {
      if (!rtn[v.id]) {
        rtn[v.id] = { domains: new Set(), variables: [] };
      }
      rtn[v.id].domains.add(name);
      rtn[v.id].variables.push(v);
    });
  });
  return rtn;
}

export function getVariableExtractors(
  localExtractorList: Record<string, any>[]
): Record<string, Extractor> {
  const extractors: Record<string, any> = {};
  localExtractorList.forEach((localExtractors) => {
    for (var name in localExtractors) {
      if (!(name in extractors)) {
        extractors[name] = localExtractors[name];
      }
    }
  });
  return createExtractors(extractors);
}

function createExtractors(
  extractorMap: Record<string, any>
): Record<string, Extractor> {
  const rtn: Record<string, Extractor> = {};
  Object.entries(extractorMap).forEach(([name, args]) => {
    if (!(name in EXTRACTORS)) {
      console.error(`Unexpected extractor: ${name}`);
      return;
    }
    rtn[name] = new EXTRACTORS[name](args);
  });
  return rtn;
}
