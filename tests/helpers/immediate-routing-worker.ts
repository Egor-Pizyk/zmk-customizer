import { PendingRoutingWorker } from './routing-worker';
import type { WiringWorkerRequest } from '@ui/schematic/wiring/logic';

export class ImmediateRoutingWorker extends PendingRoutingWorker {
  override postMessage(input: WiringWorkerRequest) {
    super.postMessage(input, []);
    queueMicrotask(() => {
      if (!this.isTerminated) {
        this.complete();
      }
    });
  }
}
