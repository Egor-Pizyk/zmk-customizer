import { getMarqueeSelection } from './get-marquee-selection';
import type { PointerState } from './pointer-types';

const MARQUEE_MIN_SIZE_U = 0.05;

export function endMarqueeDrag(state: PointerState, project: PointerState['project']) {
  const { drag } = state;
  if (drag?.kind !== 'marquee') {
    return;
  }
  const width = Math.abs(drag.end.xU - drag.start.xU);
  const height = Math.abs(drag.end.yU - drag.start.yU);
  if (width < MARQUEE_MIN_SIZE_U && height < MARQUEE_MIN_SIZE_U) {
    state.onSelectionChange();
    return;
  }
  if (drag.base !== project) {
    state.onSelectionChange();
    return;
  }
  state.onSelectionChange(
    getMarqueeSelection(project, {
      marquee: drag,
      selection: state.selection,
      additive: drag.additive,
    }),
  );
}
