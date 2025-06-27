"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="7fc80cb3-5fc0-5073-afd6-9a37b0ac4c25")}catch(e){}}();

const discord_js_1 = require("discord.js");
const perf_hooks_1 = require("perf_hooks");
const util_1 = require("util");
const functions_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/functions");
const console_1 = require("../../../../../../../../shared/utils/functions/console");
const EvalCommand = {
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
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText) {
            return;
        }
        // Parse flags and code
        const { flags, code } = await (0, functions_1.parseInput)(args);
        if (!code) {
            return await (0, functions_1.sendError)(message, "No code provided", prefix);
        }
        try {
            // Prepare evaluation context
            //const context = await createEvalContext(client, message);
            const startTime = perf_hooks_1.performance.now();
            const hrStart = process.hrtime();
            // Execute the code
            let evaluated;
            if (flags.async) {
                evaluated = await eval(`(async () => { ${code} })()`);
            }
            else {
                evaluated = eval(code);
            }
            // Handle promises
            if (evaluated instanceof Promise) {
                evaluated = await evaluated;
            }
            const executionTimeMs = perf_hooks_1.performance.now() - startTime;
            const hrEnd = process.hrtime(hrStart);
            const executionTimeSec = `${hrEnd[0]}.${Math.floor(hrEnd[1] / 1e6)}s`;
            // Process the output
            const output = (0, util_1.inspect)(evaluated, {
                depth: flags.deep ? null : 0,
                colors: false,
                maxArrayLength: flags.full ? null : 100,
            });
            // Create debug info
            const debugInfo = await (0, functions_1.createDebugInfo)({
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
            return await (0, functions_1.sendResponse)(message, {
                code,
                output,
                debugInfo,
                executionTimeMs,
                executionTimeSec,
                type: typeof evaluated,
                evaluated,
                flags,
            });
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `Error in eval command: ${error}`);
            console.error(error);
            return await (0, functions_1.sendError)(message, error, prefix, code);
        }
    },
};
module.exports = EvalCommand;
//# sourceMappingURL=eval.js.map
//# debugId=7fc80cb3-5fc0-5073-afd6-9a37b0ac4c25
