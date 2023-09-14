import { DateTimeResolver } from 'graphql-scalars';
import { scalarType } from 'nexus';

export const DataSourceOutput = scalarType({ name: 'DataSourceOutput' });
export const DataSourceRequest = scalarType({ name: 'DataSourceRequest' });
export const InsertionPath = scalarType({ name: 'InsertionPath' });
export const SlateNodeArray = scalarType({ name: 'SlateNodeArray' });
export const ToolInput = scalarType({ name: 'ToolInput' });
export const ToolConfiguration = scalarType({ name: 'ToolConfiguration' });
export const WidgetInput = scalarType({ name: 'WidgetInput' });
export const Json = scalarType({ name: 'Json' });

// TODO: current "any", change to have a sourceType ala
// export const DateTime = scalarType({ ...DateTimeResolver, sourceType: 'Date' });
// Even better: convert to a luxon scalar!

export const DateTime = DateTimeResolver;
