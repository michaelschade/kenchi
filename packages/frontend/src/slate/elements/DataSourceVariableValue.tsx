import { DataSourceVariableElement } from '@kenchi/slate-tools/lib/types';

import { useDataSourceVariableValue } from '../../dashboard/dataSources/useDataSourceVariables';

type PropsForDataSourceVariableValue = {
  element: DataSourceVariableElement;
};

export const DataSourceVariableValue = ({
  element,
}: PropsForDataSourceVariableValue) => {
  const key = element.dataSourceVariableId;
  const variableValue = useDataSourceVariableValue(key);
  return <span>{variableValue}</span>;
};
