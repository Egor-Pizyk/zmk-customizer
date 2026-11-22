import { calculateWiringProposal } from './calculate-wiring-proposal';
import type { WiringWorkerRequest } from './wiring-worker-protocol';

globalThis.addEventListener('message', (event: MessageEvent<WiringWorkerRequest>) => {
  globalThis.postMessage(calculateWiringProposal(event.data), { transfer: [] });
});
