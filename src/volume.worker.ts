import { prepareDicomBytes, prepareNiftiBytes } from './assemble.ts';
import { inflateIfNeeded } from './inflate.ts';
import { toWire } from './wire.ts';

interface WorkerRequest {
  id: number;
  op: 'nifti' | 'dicom';
  name: string;
  image?: ArrayBuffer;
  mask?: ArrayBuffer;
  slices?: ArrayBuffer[];
}

const worker = self as DedicatedWorkerGlobalScope;

worker.onmessage = (event: MessageEvent<WorkerRequest>) => {
  void run(event.data);
};

async function run(message: WorkerRequest): Promise<void> {
  try {
    const report = (ratio: number, label: string) => {
      worker.postMessage({ id: message.id, op: 'progress', ratio, label });
    };
    const prepared = message.op === 'nifti'
      ? prepareNiftiBytes(
        await inflateIfNeeded(new Uint8Array(message.image!)),
        message.mask ? await inflateIfNeeded(new Uint8Array(message.mask)) : undefined,
        message.name,
        report,
      )
      : prepareDicomBytes((message.slices ?? []).map((slice) => new Uint8Array(slice)), message.name, report);
    const { wire, transfers } = toWire(prepared);
    worker.postMessage({ id: message.id, op: 'done', wire }, transfers);
  } catch (error) {
    worker.postMessage({
      id: message.id,
      op: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
