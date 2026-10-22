import { getWireSections } from '@domain/wires';
import { WiresLayer } from '@ui/schematic/rendering/components';
import type { SchematicSelection } from '@ui/schematic/interaction';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { buildProject, freeEnd } from '../../../../helpers/build-project';
import { getDefinedValue } from '../../../../helpers/defined-value';

it('restores bend handles when a wire section is selected again', () => {
  const project = buildProject({
    wires: [
      {
        id: 'w1',
        start: freeEnd(0, 0),
        end: freeEnd(4, 2),
        bends: [
          { xU: 1, yU: 0 },
          { xU: 1, yU: 2 },
        ],
      },
    ],
  });
  const section = getDefinedValue(getWireSections(project)[0]);
  const selection: SchematicSelection = {
    kind: 'sections',
    base: project,
    sectionIds: [section.id],
  };
  const props = {
    project,
    view: { pxPerU: 48, zoom: 1, panXPx: 0, panYPx: 0 },
    paths: new Map(),
    selection,
    crossings: [],
  };

  const markup = renderToStaticMarkup(
    <svg>
      <WiresLayer {...props} />
    </svg>,
  );

  expect(markup.match(/data-bend-index=/gu)).toHaveLength(2);
});
