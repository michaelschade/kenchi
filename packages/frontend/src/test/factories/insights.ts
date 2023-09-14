import { Factory } from 'fishery';

import { InsightsOutput } from '../../graphql/generated';

const insightsFactory = Factory.define<InsightsOutput>(() => ({
  __typename: 'InsightsOutput',
  data: null,
  error: null,
  latestData: null,
}));

export default insightsFactory;
