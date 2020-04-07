import { Run } from "./github";

export interface Wait {
  wait(secondsSoFar?: number): Promise<number>;
}

export class Waiter implements Wait {
  private readonly info: (msg: string) => void;
  private readonly getRun: () => Promise<Run>;
  private readonly pollIntervalSeconds: number;
  private readonly continueAfterSeconds: number | undefined;
  private readonly failAfterSeconds: number | undefined;
  constructor(
    getRun: () => Promise<Run>,
    pollIntervalSeconds: number,
    continueAfterSeconds: number | undefined,
    failAfterSeconds: number | undefined,
    info: (msg: string) => void
  ) {
    this.getRun = getRun;
    this.pollIntervalSeconds = pollIntervalSeconds;
    this.continueAfterSeconds = continueAfterSeconds;
    this.failAfterSeconds = failAfterSeconds;
    this.info = info;
  }

  wait = async (secondsSoFar?: number) => {
    if (
      this.continueAfterSeconds &&
      (secondsSoFar || 0) >= this.continueAfterSeconds
    ) {
      this.info(`🤙Exceeded wait seconds. Continuing...`);
      return secondsSoFar || 0;
    }
    if (
      this.failAfterSeconds &&
      (secondsSoFar || 0) >= this.failAfterSeconds
    ) {
      this.info(`🤙Exceeded wait failing seconds. Failing...`);
      throw "Timeout"
    }
    const run = await this.getRun();
    if (run.status === "completed") {
      this.info(`👍 Run ${run.html_url} complete.`);
      return secondsSoFar || 0;
    }
    this.info(`✋Awaiting run ${run.html_url}...`);
    var waitDuration = (this.continueAfterSeconds && this.continueAfterSeconds < this.pollIntervalSeconds) ? this.continueAfterSeconds : this.pollIntervalSeconds;
    waitDuration = (this.failAfterSeconds && this.failAfterSeconds < this.pollIntervalSeconds) ? this.failAfterSeconds : waitDuration;
    await new Promise(resolve =>
      setTimeout(resolve, waitDuration * 1000)
    );
    return this.wait((secondsSoFar || 0) + waitDuration);
  };
}
