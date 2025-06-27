import { StatusHandlerConfig } from "./types";

const config: StatusHandlerConfig = {
  enabled: false,
  timeout: 30000, // 30 seconds timeout for API requests
  updateInterval: 5 * 60 * 1000, // 5 minutes by default
  channelId: "",
  messageId: "", // Optional but recommended
  defaultServer: "", // Default server to show
  servers: [
    /*         {
          name: "Demoscraft",
          type: "java",
          ip: "104.243.46.174",
          port: 25566,
          displayName: "Demoscraft",
          description: "A Minecraft server for demos and testing",
        },
        {
          name: "Fade Cloud",
          type: "java",
          ip: "fadecloud.com",
          port: 25565,
          displayName: "Fade Cloud",
          description: "A popular Minecraft server with various game modes",
        } */
  ],
};

export default config;
