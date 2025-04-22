import { config } from "@utils/config";

export function hostURL(): string {
  const host =
    config.environments.default.api.host === "localhost"
      ? "http://localhost"
      : `https://${config.environments.default.api.host}`;
  const port = config.environments.default.api.port;

  if (config.environments.default.api.host === "localhost") {
    return `${host}:${port}`;
  }
  return `${host}`;
}
