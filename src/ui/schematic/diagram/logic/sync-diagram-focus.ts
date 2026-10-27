export function captureDiagramFocus(host: HTMLElement) {
  const active = host.ownerDocument.activeElement;
  const keyId =
    host.contains(active) && (active instanceof HTMLElement || active instanceof SVGElement)
      ? active.dataset['keyFocusId']
      : undefined;
  return () => {
    if (
      keyId === undefined ||
      (active === host.ownerDocument.activeElement && active?.isConnected === true)
    ) {
      return;
    }
    const target = [...host.querySelectorAll<SVGElement | HTMLElement>('[data-key-focus-id]')].find(
      (element) => element.dataset['keyFocusId'] === keyId,
    );
    if (target instanceof SVGElement || target instanceof HTMLElement) {
      target.focus({ preventScroll: true });
    }
  };
}
