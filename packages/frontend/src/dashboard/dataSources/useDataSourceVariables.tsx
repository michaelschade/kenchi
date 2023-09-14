import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import get from 'lodash/get';

import useMessageRouter from '../../utils/useMessageRouter';
import { fetchGetFullResponses } from './FetchPlayback';
import { DataSourceVariable } from './types';
import { useDataSources } from './useDataSources';

const getAllPaths = (obj: any): string[][] => {
  const paths: string[][] = [];
  const recurse = (obj: any, path: string[]) => {
    if (
      typeof obj === 'object' &&
      obj !== null &&
      (!Array.isArray(obj) ||
        (Array.isArray(obj) &&
          obj.every((v) => typeof v === 'object' && v !== null)))
    ) {
      Object.keys(obj).forEach((key) => {
        recurse(obj[key], [...path, key]);
      });
    } else {
      paths.push(path);
    }
  };
  recurse(obj, []);
  return paths;
};

const getDataSourceVariableType = (value: any): string => {
  if (Array.isArray(value)) {
    return `${typeof value[0]}[]`;
  }
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  return typeof value;
};

export type DataSourceVariables = Record<string, DataSourceVariable>;

const DataSourceVariablesContext = createContext<DataSourceVariables | null>(
  null
);

export const DataSourceVariablesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const router = useMessageRouter<'dashboard'>();
  const { dataSources } = useDataSources();
  const [dataSourceVariables, setDataSourceVariables] = useState<
    Record<string, DataSourceVariable>
  >({});

  useEffect(() => {
    if (!dataSources) {
      return;
    }

    const getAllVariables = async () => {
      dataSources.forEach(async (dataSource) => {
        const responsesForDataSource = await fetchGetFullResponses(
          router,
          'ty@openphone.co',
          dataSource.requests
        );

        const variablesForDataSource: Record<string, DataSourceVariable> = {};

        Object.keys(responsesForDataSource).forEach((requestId) => {
          const response = responsesForDataSource[requestId] as any;
          const paths = getAllPaths(response);
          paths.forEach((path) => {
            const value = get(response, path);
            variablesForDataSource[
              `${dataSource.id}-${requestId}-${path.join('-')}`
            ] = {
              id: `${dataSource.id}-${requestId}-${path.join('-')}`,
              dataSourceId: dataSource.id,
              dataSourceRequestId: requestId,
              path,
              value: get(response, path),
              type: getDataSourceVariableType(value),
            };
          });
        });
        setDataSourceVariables((dsvs) => ({
          ...dsvs,
          ...variablesForDataSource,
        }));
      });
    };

    getAllVariables();
  }, [dataSources, router]);

  return (
    <DataSourceVariablesContext.Provider value={dataSourceVariables}>
      {children}
    </DataSourceVariablesContext.Provider>
  );
};

export const useDataSourceVariables = () => {
  const dataSourceVariables = useContext(DataSourceVariablesContext);
  if (!dataSourceVariables) {
    throw new Error(
      'useDataSourceVariables must be used within a DataSourceVariablesProvider'
    );
  }
  return dataSourceVariables;
};

export const useDataSourceVariableValue = (key: string) => {
  const dataSourceVariables = useContext(DataSourceVariablesContext);
  if (!dataSourceVariables) {
    throw new Error(
      'useDataSourceVariables must be used within a DataSourceVariablesProvider'
    );
  }
  return dataSourceVariables[key].value;
};
