"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="a9c26dc7-7d93-5608-af0e-3c662b299878")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const config = {
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
exports.default = config;
//# sourceMappingURL=config.js.map
//# debugId=a9c26dc7-7d93-5608-af0e-3c662b299878
