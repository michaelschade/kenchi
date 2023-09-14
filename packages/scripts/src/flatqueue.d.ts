declare module 'flatqueue' {
  import FlatQueue from 'flatqueue';

  class FlatQueue<T> {
    length: number;
    clear(): void;
    push(id: T, value: number): void;
    pop(): T | undefined;
    peek(): T | undefined;
    peekValue(): number | undefined;
  }
  export = FlatQueue;
}
