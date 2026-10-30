// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { findCanvas, canvasIdOf } from '@ui/shortcuts';

it('recognizes nested focus on both an external HTML host and the retained SVG surface', () => {
  for (const host of [
    document.createElement('div'),
    document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
  ]) {
    host.dataset['canvasWorkspace'] = 'schematic';
    const key = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    host.append(key);
    expect(findCanvas(key)).toBe(host);
    expect(canvasIdOf(findCanvas(key))).toBe('schematic');
  }
});

it('does not dispatch canvas shortcuts from an unavailable external surface', () => {
  const canvas = document.createElement('div');
  canvas.dataset['canvasWorkspace'] = 'schematic';
  const unavailable = document.createElement('div');
  unavailable.dataset['canvasInputDisabled'] = 'true';
  canvas.append(unavailable);
  expect(findCanvas(canvas)).toBeUndefined();
  unavailable.remove();
  expect(findCanvas(canvas)).toBe(canvas);
});
