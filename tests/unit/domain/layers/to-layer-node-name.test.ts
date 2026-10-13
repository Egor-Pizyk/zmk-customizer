import { expect, it } from 'vitest';
import { toLayerNodeName } from '@domain';

it.each([
  ['Nav & Sym', 'nav_sym_layer'],
  ['Base', 'base_layer'],
  ['  Nav  ', 'nav_layer'],
  ['Layer 1', 'layer_1_layer'],
  ['2nd', 'layer_2nd_layer'],
  ['Ω', ''],
  ['', ''],
])('derives the keymap node name of %j as %j (research R4)', (name, nodeName) => {
  expect(toLayerNodeName(name)).toBe(nodeName);
});
