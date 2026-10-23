import { getWireSections } from '@domain/wires';
import { getWirePath } from '@domain/wires/geometry';
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
  const wire = getDefinedValue(project.wires[0]);
  const selection: SchematicSelection = {
    kind: 'sections',
    base: project,
    sectionIds: [section.id],
  };
  const props = {
    project,
    view: { pxPerU: 48, zoom: 1, panXPx: 0, panYPx: 0 },
    paths: new Map([['w1', getWirePath(project, wire)]]),
    selection,
    crossings: [],
  };

  const markup = renderToStaticMarkup(
    <svg>
      <WiresLayer {...props} />
    </svg>,
  );

  expect(markup.match(/data-bend-index=/gu)).toHaveLength(2);
  expect(markup.match(/data-wire-bend=""/gu)).toHaveLength(2);
});

it('shows a draggable square on every derived right-angle corner without selection', () => {
  const project = buildProject({
    wires: [{ id: 'w1', start: freeEnd(0, 0), end: freeEnd(4, 2), bends: [] }],
  });
  const wire = getDefinedValue(project.wires[0]);
  const markup = renderToStaticMarkup(
    <svg>
      <WiresLayer
        project={project}
        view={{ pxPerU: 48, zoom: 1, panXPx: 0, panYPx: 0 }}
        paths={new Map([['w1', getWirePath(project, wire)]])}
        selection={undefined}
        crossings={[]}
      />
    </svg>,
  );

  expect(markup.match(/data-wire-bend=""/gu)).toHaveLength(1);
  expect(markup).toContain('data-bend-x-u="4"');
  expect(markup).toContain('data-bend-y-u="0"');
  expect(markup).not.toContain('data-bend-index');
});

it('retains a saved straight-line bend handle so a double-clicked point can be dragged', () => {
  const project = buildProject({
    wires: [{ id: 'w1', start: freeEnd(0, 0), end: freeEnd(4, 0), bends: [{ xU: 2, yU: 0 }] }],
  });
  const wire = getDefinedValue(project.wires[0]);
  const markup = renderToStaticMarkup(
    <svg>
      <WiresLayer
        project={project}
        view={{ pxPerU: 48, zoom: 1, panXPx: 0, panYPx: 0 }}
        paths={new Map([['w1', getWirePath(project, wire)]])}
        selection={undefined}
        crossings={[]}
      />
    </svg>,
  );
  expect(markup.match(/data-wire-bend=""/gu)).toHaveLength(1);
  expect(markup).toContain('data-bend-index="0"');
});
