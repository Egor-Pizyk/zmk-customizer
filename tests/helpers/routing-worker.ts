import { calculateWiringProposal } from '@ui/schematic/wiring/logic';
import type { WiringWorkerRequest } from '@ui/schematic/wiring/logic';

export class PendingRoutingWorker extends EventTarget {
  static readonly instances: PendingRoutingWorker[] = [];
  input: WiringWorkerRequest | undefined;
  isTerminated = false;
  constructor() {
    super();
    PendingRoutingWorker.instances.push(this);
  }
  postMessage(input: WiringWorkerRequest, _transfer: readonly Transferable[]) {
    this.input = structuredClone(input);
  }
  terminate() {
    this.isTerminated = true;
  }
  fail(message: string) {
    this.dispatchEvent(new ErrorEvent('error', { message }));
  }
  complete() {
    if (this.input === undefined) {
      throw new Error('No routing request');
    }
    const reply = calculateWiringProposal(this.input);
    this.dispatchEvent(new MessageEvent('message', { data: reply }));
    return reply;
  }
}

export function latestRoutingWorker(): PendingRoutingWorker {
  const worker = PendingRoutingWorker.instances.at(-1);
  if (worker === undefined) {
    throw new Error('No routing worker was started');
  }
  return worker;
}
