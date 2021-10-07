/**
 * Provides a queue.
 * @module Queue
 */

/** Implements a queue using a map, ft. O(1) enqueue and dequeue. */
class Queue<Type> {
  private storage: Map<number, Type>;
  private head: number;
  private tail: number;

  /** Initialize queue. */
  constructor() {
    this.storage = new Map();
    // Index of first item; index of nothing when queue is empty.
    this.head = 0;
    // One later index than last index; one later index of nothing when queue is empty.
    this.tail = 0;
  }

  /**
   * Add an item to the queue.
   * @param item - Item to add to the queue.
   * @throws {Error} When the queue is full and there's no space for addition.
   */
  enqueue(item: Type): void {
    if (this.storage.has(this.tail)) {
      throw new Error("Queue is full");
    }
    this.storage.set(this.tail++, item);
    if (this.tail === Number.MAX_SAFE_INTEGER) {
      this.tail = Number.MIN_SAFE_INTEGER;
    }
  }

  /**
   * Removes the first item.
   * @returns The item.
   * @throws {Error} When the queue is empty or if the retval was undefined for some reason.
   */
  dequeue(): Type {
    if (this.head === this.tail && !this.storage.has(this.head)) {
      throw new Error("Queue is empty");
    }
    const retval: Type | undefined = this.storage.get(this.head++);
    if (retval === undefined) {
      throw new Error("Dequeue returned undefined");
    }
    if (this.head === Number.MAX_SAFE_INTEGER) {
      this.head = Number.MIN_SAFE_INTEGER;
      this.storage.delete(Number.MAX_SAFE_INTEGER - 1);
    } else {
      this.storage.delete(this.head - 1);
    }
    return retval;
  }

  /**
   * Determines whether queue is empty or not
   * @returns True for empty, false for non-empty.
   */
  empty(): boolean {
    return this.storage.size === 0;
  }
}

export { Queue };
