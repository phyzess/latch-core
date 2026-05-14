export function bindServiceIconFallbacks(root: ParentNode): void {
  for (const image of root.querySelectorAll<HTMLImageElement>(".service-icon-image")) {
    const showFallback = () => showServiceIconFallback(image);
    image.addEventListener("error", showFallback, { once: true });

    if (image.complete && image.naturalWidth === 0) {
      showFallback();
    }
  }
}

function showServiceIconFallback(image: HTMLImageElement): void {
  image.hidden = true;

  const fallback = image.nextElementSibling;
  if (fallback instanceof HTMLElement) {
    fallback.hidden = false;
  }
}
