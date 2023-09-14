// Slate

export type ComputedValueConcat = {
  type: 'concat';
  children: ComputedValue[];
};

export type ComputedValueInput = {
  type: 'input';
  id: string;
};

export type ComputedValueRequest = {
  type: 'request';
  requestId: string;
  path: ResponseBodyPath;
};

export type ComputedValueText = {
  type: 'text';
  text: string;
};

export type ComputedValue =
  | ComputedValueConcat
  | ComputedValueInput
  | ComputedValueRequest
  | ComputedValueText;

export type ResponseBodyPath = (string | number)[];

// Found in a Json blob to indicate we're now in a rendered value string.
export function isComputedValueWrapper(
  value: unknown
): value is ComputedValueWrapper {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>).__kenchiValueWrapper === 'boolean'
  );
}
export type ComputedValueWrapper = {
  __kenchiValueWrapper: true;
  value: ComputedValue;
};

export type QueryParamValue =
  | undefined
  | ComputedValueWrapper
  | QueryParams
  | QueryParamValue[];

export interface QueryParams {
  [key: string]: QueryParamValue;
}

type JsonObject = { [Key in string]?: JsonValue };
type JsonArray = JsonValue[];
export type JsonValue =
  | string
  | number
  | boolean
  | JsonObject
  | JsonArray
  | null;

export type DataSourceRequest = {
  id: string;
  name: string;

  type: 'networkRequest';
  method: string;
  credentials: 'include' | 'omit';

  url: ComputedValue;
  queryParams: QueryParams;
  headers: Record<string, ComputedValue>;
  body?: JsonValue;
};

export type DataSourceOutput = {
  id: string;
  name: string;
  value: ComputedValueRequest;
};

export type DataSource = {
  id: string;
  name: string;
  requests: DataSourceRequest[];
  outputs: DataSourceOutput[];
};

export type DataSourceVariableValue = string | number | boolean | null;

export type DataSourceVariable = {
  id: string;
  dataSourceId: string;
  dataSourceRequestId: string;
  path: ResponseBodyPath;
  value: DataSourceVariableValue;
  type: string;
};
