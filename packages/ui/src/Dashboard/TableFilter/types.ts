type FilterProps<TValue> = {
  onChange: (value: TValue) => void;
  value?: TValue;
};

type QueryParamArg = string | QueryParamNested | string[] | QueryParamNested[];
interface QueryParamNested {
  [key: string]: undefined | QueryParamArg;
}

export type FilterComponent<TValue, TExtraProps> = ((
  props: FilterProps<TValue> & React.RefAttributes<FilterRef> & TExtraProps
) => React.ReactElement<any, any> | null) & {
  isInlineFilter?: boolean;
  shouldFilterWhenOff?: boolean;
  convertFromQueryParam?: (value: QueryParamArg) => TValue;
  convertToQueryParam?: (value: TValue) => QueryParamArg | undefined;
};

export type FilterRef = {
  focus: () => void;
};
