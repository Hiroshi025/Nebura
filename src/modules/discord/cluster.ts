/**
 * Module for managing Discord bot clusters using `discord-hybrid-sharding`.
 * This module initializes and spawns clusters for the bot.
 */

import { ClusterManager } from "discord-hybrid-sharding";

import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";

/**
 * Determines if the environment is production.
 * @constant
 */
const isProd = process.env["NODE_ENV"] === "production";

/**
 * Path to the bot's main file, dynamically set based on the environment.
 * @constant
 */
const botFile = `${__dirname}/infrastructure/class.${isProd ? "js" : "ts"}`;

/**
 * ClusterManager instance for managing Discord bot clusters.
 *
 * @see {@link https://www.npmjs.com/package/discord-hybrid-sharding|discord-hybrid-sharding}
 */
const manager = new ClusterManager(botFile, {
  totalShards: "auto", // Automatically determine the number of shards
  shardsPerClusters: 2, // Number of shards per cluster
  mode: "process", // Use process mode for clustering
  token: config.modules.discord.token, // Discord bot token
  execArgv: isProd ? [] : [...process.execArgv], // Execution arguments based on environment
});

/**
 * Event listener for when a new cluster is created.
 * Logs cluster details to the console.
 *
 * @event clusterCreate
 * @param cluster - The created cluster instance.
 */
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

/**
 * Spawns the clusters with no timeout.
 *
 * @see {@link https://www.npmjs.com/package/discord-hybrid-sharding|discord-hybrid-sharding}
 */
manager.spawn({ timeout: -1 });
