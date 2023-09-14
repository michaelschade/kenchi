import { ThemeProvider } from '@emotion/react';
import { htmlToText } from 'html-to-text';
import { renderToStaticMarkup } from 'react-dom/server';

import { SlateConfig } from '@kenchi/slate-tools/lib/tool/types';
import { deserialize as deserializeSlate } from '@kenchi/slate-tools/lib/utils';
import { lightTheme } from '@kenchi/ui/lib/Colors';

import { getRenderedComponents } from '../../../slate/Renderer';
import { VariableMap, VariableMapProvider } from '../../../tool/useVariable';
import FormatterInterface from './FormatterInterface';

function getHTMLForInsert(
  configuration: SlateConfig,
  variableMap: VariableMap
): string {
  return renderToStaticMarkup(
    <ThemeProvider theme={lightTheme}>
      <VariableMapProvider value={variableMap}>
        {getRenderedComponents(deserializeSlate(configuration), {
          insertText: true,
        })}
      </VariableMapProvider>
    </ThemeProvider>
  );
}

export class DefaultFormatter implements FormatterInterface {
  formatRich(configuration: SlateConfig, variableMap: VariableMap) {
    let html = getHTMLForInsert(configuration, variableMap);
    const text = htmlToText(html, {
      hideLinkHrefIfSameAsText: true,
      singleNewLineParagraphs: true,
      wordwrap: false,
    });
    return { text, html };
  }

  formatText(configuration: SlateConfig, variableMap: VariableMap) {
    const html = getHTMLForInsert(configuration, variableMap);
    return htmlToText(html, {
      hideLinkHrefIfSameAsText: true,
      singleNewLineParagraphs: true,
      wordwrap: false,
    });
  }
}
