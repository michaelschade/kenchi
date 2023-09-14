import { SlateConfig } from '@kenchi/slate-tools/lib/tool/types';

import { VariableMap } from '../../../tool/useVariable';
import { DefaultFormatter } from './DefaultFormatter';

export default class IntercomFormatter extends DefaultFormatter {
  formatRich(configuration: SlateConfig, variableMap: VariableMap) {
    const { text, html: origHtml } = super.formatRich(
      configuration,
      variableMap
    );

    let imageNumber = 1;

    // Intercom's editor does not support multiple items inside of lists, so wrap them in BRs instead.
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(origHtml, 'text/html');
    htmlDoc.querySelectorAll('li').forEach((listItem) => {
      const newChildren: (ChildNode | string)[] = [];
      listItem.childNodes.forEach((sublistItem) => {
        if (sublistItem.nodeName === 'P') {
          newChildren.push(...sublistItem.childNodes);
        } else if (sublistItem.nodeName === 'IMG') {
          // Image tags are only supported at the top level. Hackily stick it lower in the DOM
          newChildren.push(`[See image ${imageNumber} below]`);
          const imageHeader = document.createElement('h3');
          imageHeader.innerText = `Image ${imageNumber}`;
          htmlDoc.body.appendChild(document.createElement('br'));
          htmlDoc.body.appendChild(imageHeader);
          htmlDoc.body.appendChild(sublistItem);
          imageNumber++;
        } else {
          newChildren.push(sublistItem);
        }
        newChildren.push(document.createElement('br'));
      });
      newChildren.pop();

      let parentListItem: HTMLElement | null | undefined = listItem;
      let isSubList = false;
      while ((parentListItem = parentListItem.parentElement?.closest('li'))) {
        isSubList = true;
        newChildren.unshift('- ');
      }

      if (isSubList && listItem.nextElementSibling?.nodeName === 'LI') {
        newChildren.push(document.createElement('br'));
      }

      listItem.replaceChildren(...newChildren);
    });

    return { text, html: htmlDoc.body.innerHTML };
  }
}
