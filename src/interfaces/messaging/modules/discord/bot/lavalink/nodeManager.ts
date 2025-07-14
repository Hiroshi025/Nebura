import { LavalinkNode } from "lavalink-client";

import { logWithLabel } from "@shared/utils/functions/console";

import { MyDiscord } from "../../client";

export async function LavalinkClient(client: MyDiscord) {
  client.lavalink.nodeManager.on("create", async (node: LavalinkNode) => {
    const info = await node.fetchInfo();
    logWithLabel(
      "custom",
      [
        `Lavalink Node ${info.git.branch} created successfully.`,
        `Node ID: ${node.id}`,
        `Version: ${info.version}`,
      ].join("\n"),
      {
        customLabel: "Lavalink",
      },
    );
  });

  client.lavalink.nodeManager.on("error", async (node: LavalinkNode, error: Error) => {
    logWithLabel(
      "error",
      [
        `Lavalink Node ${node.id} encountered an error: ${error.message} (${error.name})`,
        `Stack Trace: ${error.stack}`].join("\n"),
      {
        customLabel: "Lavalink",
      },
    );
  });

  client.lavalink.nodeManager.on("connect", (node) => {
    node.updateSession(true, 360e3);
  });
}
