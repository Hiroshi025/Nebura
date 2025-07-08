import { ChannelType } from "discord.js";
import { performance } from "perf_hooks";
import { inspect } from "util";

import {
	createDebugInfo, parseInput, sendError, sendResponse
} from "@/interfaces/messaging/modules/discord/structure/utils/functions";
import { logWithLabel } from "@/shared/utils/functions/console";
import { Precommand } from "@typings/modules/discord";

const EvalCommand: Precommand = {
  name: "eval",
  description: "Evaluates JavaScript code with advanced features",
  examples: ["eval client.user.tag", "eval --async await fetch('...')"],
  nsfw: false,
  owner: true,
  permissions: ["SendMessages"],
  cooldown: 10,
  aliases: ["e", "evaluate"],
  botpermissions: ["SendMessages", "AttachFiles"],
  async execute(_client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) {
      return;
    }

    // Parse flags and code
    const { flags, code } = await parseInput(args);
    if (!code) {
      return await sendError(message, "No code provided", prefix);
    }

    try {
      // Prepare evaluation context
      //const context = await createEvalContext(client, message);
      const startTime = performance.now();
      const hrStart = process.hrtime();

      // Execute the code
      let evaluated;
      if (flags.async) {
        evaluated = await eval(`(async () => { ${code} })()`);
      } else {
        evaluated = eval(code);
      }

      // Handle promises
      if (evaluated instanceof Promise) {
        evaluated = await evaluated;
      }

      const executionTimeMs = performance.now() - startTime;
      const hrEnd = process.hrtime(hrStart);
      const executionTimeSec = `${hrEnd[0]}.${Math.floor(hrEnd[1] / 1e6)}s`;

      // Process the output
      const output = inspect(evaluated, {
        depth: flags.deep ? null : 0,
        colors: false,
        maxArrayLength: flags.full ? null : 100,
      });

      // Create debug info
      const debugInfo = await createDebugInfo({
        code,
        output,
        executionTimeMs,
        executionTimeSec,
        type: typeof evaluated,
        flags,
        user: message.author,
        channel: message.channel,
        guild: message.guild,
      });

      // Prepare response
      return await sendResponse(message, {
        code,
        output,
        debugInfo,
        executionTimeMs,
        executionTimeSec,
        type: typeof evaluated,
        evaluated,
        flags,
      });
    } catch (error: any) {
      logWithLabel("error", `Error in eval command: ${error}`);
      console.error(error);

      return await sendError(message, error, prefix, code);
    }
  },
};

export = EvalCommand;
