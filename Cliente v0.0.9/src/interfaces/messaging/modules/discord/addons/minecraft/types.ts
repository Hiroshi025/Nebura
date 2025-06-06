export interface MinecraftServerConfig {
  name: string;
  type: "java" | "bedrock";
  ip: string;
  port?: number;
  displayName?: string;
  description?: string;
}

export interface StatusHandlerConfig {
  enabled: boolean;
  timeout?: number;
  updateInterval?: number;
  channelId: string;
  messageId?: string;
  servers: MinecraftServerConfig[];
  defaultServer?: string;
}