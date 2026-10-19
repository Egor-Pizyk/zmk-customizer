export function renderEncoderBindings(labels: readonly string[]): string {
  return labels.length === 0
    ? ''
    : `\n            sensor-bindings = <${labels.map((label) => `&${label}`).join(' ')}>;`;
}
