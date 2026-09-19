/**
 * CECUREUS — Global Network Event Emitter & Telemetry Bridge
 *
 * Why this file was created:
 * When mobile devices encounter transport dropouts, gateway timeouts (502/503/504),
 * or DNS failures, exposing raw Android/Java socket exceptions degrades user trust.
 * This event bridge decouples HTTP transport errors from UI presentation, allowing
 * global banners to display friendly in-app status banners without coupling to individual screens.
 */

type NetworkErrorListener = (message: string) => void;
type NetworkClearListener = () => void;

const errorListeners = new Set<NetworkErrorListener>();
const clearListeners = new Set<NetworkClearListener>();

export const networkEvents = {
  notifyError(message: string = 'Unable to connect to CecureUs service. Please check your network connection.') {
    errorListeners.forEach((listener) => {
      try {
        listener(message);
      } catch {}
    });
  },

  notifyClear() {
    clearListeners.forEach((listener) => {
      try {
        listener();
      } catch {}
    });
  },

  subscribeError(listener: NetworkErrorListener): () => void {
    errorListeners.add(listener);
    return () => errorListeners.delete(listener);
  },

  subscribeClear(listener: NetworkClearListener): () => void {
    clearListeners.add(listener);
    return () => clearListeners.delete(listener);
  },
};
