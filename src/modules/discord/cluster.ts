import { ClusterManager } from "discord-hybrid-sharding";

import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";

const isProd = process.env["NODE_ENV"] === "production";
const botFile = `${__dirname}/infrastructure/class.${isProd ? "js" : "ts"}`;

const manager = new ClusterManager(botFile, {
  totalShards: "auto",
  shardsPerClusters: 2,
  mode: "process",
  token: config.modules.discord.token,
  execArgv: isProd ? [] : [...process.execArgv],
});

manager.on("clusterCreate", async (cluster) => {
  logWithLabel(
    "cluster",
    [
      `APP Cluster Created:`,
      `  ${emojis.circle_check}  Cluster ID: ${cluster.id}`,
      `  ${emojis.circle_check}  Shards: ${manager.totalShards}`,
      `  ${emojis.circle_check}  Clusters: ${manager.totalClusters}`,
      `  ${emojis.circle_check}  Shards List: ${manager.shardClusterList}`,
    ].join("\n"),
  );
});
manager.spawn({ timeout: -1 });
