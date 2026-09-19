type Task<T = any> = () => Promise<T>;

class Queue {
  private running = 0;
  private q: Array<{ task: Task; resolve: (v: any) => void; reject: (e: any) => void; id: string }> = [];

  constructor(public name: string, public concurrency = 2) {}

  add<T>(task: Task<T>, id = Math.random().toString(36).slice(2)): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.q.push({ task, resolve, reject, id });
      this.next();
    });
  }

  private next() {
    while (this.running < this.concurrency && this.q.length) {
      const item = this.q.shift()!;
      this.running++;
      item.task()
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          this.running--;
          this.next();
        });
    }
  }

  size() { return this.q.length + this.running; }
  pending() { return this.q.length; }
}

export const downloadQueue = new Queue('downloads', 3);
export const mediaQueue = new Queue('media', 3);
export const aiQueue = new Queue('ai', 4);
export const statusQueue = new Queue('status', 5);
export const videoQueue = new Queue('video', 2);