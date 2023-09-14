import { TabOption } from '@kenchi/ui/lib/Dashboard/Tabs';

import { SetPage } from '../utils/paginationTypes';
import { useSimpleQueryParams } from '../utils/useQueryParams';

export default function useTabValue(
  tabOptions: TabOption[],
  {
    setPage,
    defaultTabValue,
  }: { setPage?: SetPage; defaultTabValue?: string } = {}
) {
  const queryParamValueForTabValue = (tabValue: string) => {
    const tabOption = tabOptions.find(
      (tabOption) => tabOption.value === tabValue
    );
    return tabOption?.queryParamValue || tabOption?.value;
  };

  const [{ tab: queryParamValue }, setQueryParams] = useSimpleQueryParams();
  const tabOptionFromQueryParams = tabOptions.find(
    (tabOption) =>
      (tabOption.queryParamValue || tabOption.value) === queryParamValue
  );
  const defaultOption =
    tabOptions.find((tabOption) => tabOption.value === defaultTabValue) ||
    tabOptions[0];

  return {
    tabValue: (tabOptionFromQueryParams || defaultOption).value,
    setTabValue: (newTabValue: string) => {
      const updatedQueryParams = {
        tab: queryParamValueForTabValue(newTabValue),
      };
      if (setPage) {
        setPage(1);
      }
      setQueryParams(updatedQueryParams, { shouldReplaceState: true });
    },
  };
}
