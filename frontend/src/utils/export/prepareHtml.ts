import { serializeWidgets } from './serializeWidgets';

export interface PrepareHtmlOptions {
  /** Optional title used for the generated HTML document. */
  title?: string;
  /** A list of external stylesheet URLs to inject into the export document. */
  stylesheets?: string[];
  /** Inline CSS blocks that should be appended to the export document's head section. */
  inlineStyles?: string[];
  /**
   * HTML meta charset value. Pass `null` to skip emitting the charset meta tag.
   * Defaults to `utf-8`.
   */
  charset?: string | null;
}

export interface PrepareHtmlResult {
  /** Fully serialised HTML string including the document type declaration. */
  html: string;
  /** The cloned body element after widget serialisation. */
  body: HTMLElement;
  /** The export document instance that was generated. */
  document: Document;
}

const createDocument = (source: HTMLElement, title?: string): Document => {
  const owner = source.ownerDocument;
  const doc = owner?.implementation
    ? owner.implementation.createHTMLDocument(title ?? owner.title ?? 'Document Export')
    : document.implementation.createHTMLDocument(title ?? 'Document Export');

  doc.title = title ?? owner?.title ?? doc.title;
  return doc;
};

const injectHeadAssets = (doc: Document, options: PrepareHtmlOptions) => {
  const { stylesheets = [], inlineStyles = [], charset } = options;

  const head = doc.head ?? doc.getElementsByTagName('head')[0];

  if (charset !== null) {
    const meta = doc.createElement('meta');
    meta.setAttribute('charset', (charset ?? 'utf-8').toLowerCase());
    head.appendChild(meta);
  }

  stylesheets.forEach((href) => {
    if (!href) {
      return;
    }
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    head.appendChild(link);
  });

  inlineStyles.forEach((css) => {
    if (!css) {
      return;
    }
    const style = doc.createElement('style');
    style.type = 'text/css';
    style.appendChild(doc.createTextNode(css));
    head.appendChild(style);
  });
};

export const prepareHtml = async (
  sourceBody: HTMLElement,
  options: PrepareHtmlOptions = {},
): Promise<PrepareHtmlResult> => {
  const exportDocument = createDocument(sourceBody, options.title);
  const clonedBody = sourceBody.cloneNode(true) as HTMLElement;

  exportDocument.body.replaceChildren(clonedBody);
  injectHeadAssets(exportDocument, options);

  await serializeWidgets({
    sourceRoot: sourceBody,
    targetRoot: clonedBody,
    document: exportDocument,
  });

  const doctype = '<!DOCTYPE html>';
  const html = `${doctype}\n${exportDocument.documentElement.outerHTML}`;

  return {
    html,
    body: clonedBody,
    document: exportDocument,
  };
};

