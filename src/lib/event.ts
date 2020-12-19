export type Event<T = unknown> = (data: T, callback: (data: T) => void) => void;

export class EventEmitter {
  events: Record<string, Event[]> = {};

  /**
   * Send new event to emitter
   * @param eventName
   * @param data
   * @param callback
   */
  emit<T>(eventName: string, data: T, callback: (data: T) => unknown): void {
    const event = this.events[eventName];
    if (event) {
      event.forEach((fn) => fn(data, callback));
    }
  }

  /**
   * Event listener
   * @param eventName
   * @param callback
   */
  on<T>(eventName: string, callback: Event<T>): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(callback);
    return () => {
      this.events[eventName] = this.events[eventName].filter(
        (eventFn) => callback !== eventFn
      );
    };
  }

  clearAll(): void {
    this.events = {};
  }
}
