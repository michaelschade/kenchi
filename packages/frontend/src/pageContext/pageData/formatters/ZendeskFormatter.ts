import { SlateConfig } from '@kenchi/slate-tools/lib/tool/types';

import { VariableMap } from '../../../tool/useVariable';
import { DefaultFormatter } from './DefaultFormatter';

export default class ZendeskFormatter extends DefaultFormatter {
  formatRich(configuration: SlateConfig, variableMap: VariableMap) {
    const { text, html: origHtml } = super.formatRich(
      configuration,
      variableMap
    );

    let html = origHtml.replace(/<p>\s*<\/p>/g, '<p><br /></p>');

    return { text, html };
  }
}
