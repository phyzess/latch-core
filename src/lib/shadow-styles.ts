const sheetCache = new Map<string, CSSStyleSheet>();

export function applyShadowStyles(root: ShadowRoot, css: string): void {
  if (supportsConstructableStyleSheets()) {
    let sheet = sheetCache.get(css);
    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      sheetCache.set(css, sheet);
    }

    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    return;
  }

  const style = document.createElement("style");
  style.textContent = css;
  root.append(style);
}

function supportsConstructableStyleSheets(): boolean {
  return (
    "adoptedStyleSheets" in Document.prototype &&
    "adoptedStyleSheets" in ShadowRoot.prototype &&
    "replaceSync" in CSSStyleSheet.prototype
  );
}
