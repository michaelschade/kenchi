import { faFileDownload } from '@fortawesome/pro-solid-svg-icons';

import { LinkButtonWithIcon } from '../LinkWithIcon';
import { isHeadingData } from '.';
import { ColumnHeading } from './RawTable';

const formatRow = (row: (string | number)[]) => {
  return row.map((rawCellValue) => {
    if (
      typeof rawCellValue === 'string' &&
      (rawCellValue.includes('"') ||
        rawCellValue.includes(',') ||
        rawCellValue.includes('\n'))
    ) {
      return `"${rawCellValue.replace(/"/g, '""')}"`;
    }
    return rawCellValue;
  });
};

type PropsForExport = {
  data: any;
  renderRow: (item: any) => (string | number)[];
  columnHeadings: ColumnHeading[];
  fileName: string;
  onClickExport: () => void;
  disabled?: boolean;
};

export const CSVExport = ({
  data,
  renderRow,
  columnHeadings,
  fileName,
  disabled = false,
  ...props
}: PropsForExport) => {
  const onClickExport = () => {
    const csvColumnHeadings = columnHeadings
      // Removes values like '', which serve as spacer column headings
      .filter((columnHeading) => Boolean(columnHeading))
      .map((columnHeading) =>
        isHeadingData(columnHeading)
          ? columnHeading.value.toString()
          : columnHeading
      )
      .join(',');
    const csvRows = data.map(renderRow).map(formatRow).join('\n');
    const csvContent = [csvColumnHeadings, csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
    props.onClickExport();
  };
  return (
    <LinkButtonWithIcon
      title="Download CSV"
      onClick={onClickExport}
      disabled={disabled}
      icon={faFileDownload}
    >
      Export
    </LinkButtonWithIcon>
  );
};
