import { API } from "./backend";

process.loadEnvFile();
export class MainGlobal {
  public api: API;
  constructor() {
    this.api = new API();
  }

  public async Start() {
    await this.api.Start();
  }
}

export const main = new MainGlobal();
main.Start().catch((err) => {
  console.error("Error starting the application:", err);
  process.exit(1);
});
