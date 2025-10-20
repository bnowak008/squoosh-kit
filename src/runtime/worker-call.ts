/**
 * Generic worker communication helper with support for transferables and AbortSignal
 */

export interface WorkerRequest<T = unknown> {
  type: string;
  id: number;
  payload: T;
}

export interface WorkerResponse<T = unknown> {
  id: number;
  ok: boolean;
  data?: T;
  error?: string;
}

let requestId = 0;

/**
 * Call a worker with a typed request and wait for response
 * 
 * @param worker - The worker instance to call
 * @param type - The message type
 * @param payload - The payload to send
 * @param signal - Optional AbortSignal to cancel the operation
 * @param transfer - Optional list of Transferable objects to transfer
 * @returns Promise that resolves with the worker's response data
 */
export async function callWorker<TPayload, TResponse>(
  worker: Worker,
  type: string,
  payload: TPayload,
  signal?: AbortSignal,
  transfer?: Transferable[]
): Promise<TResponse> {
  return new Promise<TResponse>((resolve, reject) => {
    const id = ++requestId;

    // Check if already aborted
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const response = event.data as WorkerResponse<TResponse>;
      if (response.id !== id) return;

      cleanup();

      if (response.ok && response.data !== undefined) {
        resolve(response.data);
      } else {
        reject(new Error(response.error || 'Unknown worker error'));
      }
    };

    const handleError = (error: ErrorEvent) => {
      cleanup();
      reject(new Error(`Worker error: ${error.message}`));
    };

    const handleAbort = () => {
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    const cleanup = () => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      signal?.removeEventListener('abort', handleAbort);
    };

    // Set up listeners
    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    signal?.addEventListener('abort', handleAbort);

    // Send the request
    const request: WorkerRequest<TPayload> = { type, id, payload };
    
    if (transfer && transfer.length > 0) {
      worker.postMessage(request, transfer);
    } else {
      worker.postMessage(request);
    }
  });
}
