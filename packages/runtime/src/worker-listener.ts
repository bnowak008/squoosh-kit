import type { WorkerRequest, WorkerResponse } from './worker-call';

type WorkerAction<TPayload, TResponse> = {
  bivarianceHack(payload: TPayload): Promise<TResponse> | TResponse;
}['bivarianceHack'];

interface WorkerActions {
  [key: string]: WorkerAction<unknown, unknown>;
}

export function createWorkerListener<T extends WorkerActions>(actions: T) {
  self.onmessage = async (event: MessageEvent) => {
    const request = event.data as WorkerRequest;
    const action = actions[request.type];

    if (!action) {
      console.warn(`Unknown action type: ${request.type}`);
      return;
    }

    try {
      const data = await action(request.payload);
      const response: WorkerResponse = {
        id: request.id,
        ok: true,
        data,
      };
      self.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = {
        id: request.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
      self.postMessage(response);
    }
  };
}
