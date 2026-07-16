export interface Job<T = unknown> {
  name: string;
  payload: T;
}
export interface JobRunner {
  enqueue<T>(job: Job<T>, handler: (payload: T) => Promise<void>): Promise<void>;
}
export class SynchronousJobRunner implements JobRunner {
  async enqueue<T>(job: Job<T>, handler: (payload: T) => Promise<void>) {
    await handler(job.payload);
  }
}
export const jobs: JobRunner = new SynchronousJobRunner();
