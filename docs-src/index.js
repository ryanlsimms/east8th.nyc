import content from './content.js';
import { t } from 'kensington';
import head from './head.js';

export default function generateHtml() {
  return t.htmlWithDocType({ lang: 'en' }, [
    head,
    t.body(content),
  ]).toString();
}
