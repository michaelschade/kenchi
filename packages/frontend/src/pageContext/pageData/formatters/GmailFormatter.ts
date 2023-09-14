import { SlateConfig } from '@kenchi/slate-tools/lib/tool/types';

import { VariableMap } from '../../../tool/useVariable';
import { DefaultFormatter } from './DefaultFormatter';

export default class GmailFormatter extends DefaultFormatter {
  formatRich(configuration: SlateConfig, variableMap: VariableMap) {
    const { text, html: origHtml } = super.formatRich(
      configuration,
      variableMap
    );

    // Turn each <p> into a single newline matching the native formatting of that editor.
    // End result:
    //  - <p>Hi</p><p>Bye</p> => <div>Hi</div><div>Bye</div>
    //  - <p>Hi</p><p></p><p>Bye</p> => <div>Hi</div><div><br /></div><div>Bye</div>
    let html = origHtml.replace(/<p>\s*<\/p>/g, '<div><br /></div>');
    html = html.replace(/<p>/g, '<div>');
    html = html.replace(/<\/p>/g, '</div>');

    return { text, html };
  }
}
