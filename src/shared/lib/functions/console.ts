/* eslint-disable @typescript-eslint/no-explicit-any */
/*
# Discord Server: http://discord.night-support.xyz/
# Github: https://github.com/MikaboshiDev
# Docs: https://docs.night-support.xyz/
# Dashboard: http://api.night-support.xyz/

# Created by: MikaboshiDev
# Version: 1.0.3
# Discord: azazel_hla

# This file is the main configuration file for the bot.
# Inside this file you will find all the settings you need to configure the bot.
# If you have any questions, please contact us on our discord server.
# If you want to know more about the bot, you can visit our website.
*/

import chalk from "chalk";

import { labelColors, labelNames, Labels } from "@/infra/constants/tools.constants";

import { config } from "../../utils/config";

/**
 * The function `logWithLabel` logs messages to the console with specific formatting and colors based
 * on the provided label.
 * @param {Labels | 'custom'} label - The `label` parameter in the `logWithLabel` function is used to
 * specify the type of label to be used for logging. It can be one of the predefined labels from the
 * `Labels` enum or a custom label specified as a string.
 * @param {string} message - The `message` parameter in the `logWithLabel` function is a string that
 * represents the actual message you want to log to the console. It could be any information, warning,
 * error, or debug message that you want to display along with the specified label.
 * @param {string} [customName] - The `customName` parameter in the `logWithLabel` function is an
 * optional parameter of type `string`. It is used when the `label` parameter is set to `'custom'`,
 * indicating a custom label type. If the `label` is `'custom'`, then the `customName
 */
export async function logWithLabel(label: Labels | "custom", message: string, customName?: string) {
  if (label === "custom" && customName === undefined) {
    throw new Error("Custom label name must be provided when using the custom label type.");
  }

  let labelName: string;
  let labelColor: chalk.Chalk;

  if (label === "custom") {
    labelName = customName!;
    labelColor = chalk.hex("#5c143b");
  } else {
    labelName = labelNames[label];
    labelColor = labelColors[label];
  }
  /* --- Log message to console --- */
  const _getLogOrigin = () => {
    let filename: any;

    const _pst = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_err, stack) {
      return stack;
    };
    try {
      /* The code snippet you provided is a part of the `_getLogOrigin` function in your TypeScript file.
      This function is responsible for determining the origin or source file of the log message being
      processed. Here's a breakdown of what the code is doing: */
      const err: any = new Error();
      let callerfile: string;

      const currentfile: string = err.stack.shift().getFileName();

      while (err.stack.length) {
        callerfile = err.stack.shift().getFileName();

        if (currentfile !== callerfile) {
          filename = callerfile;
          break;
        }
      }
    } catch (err) {
      throw new Error(err as string);
    }
    Error.prepareStackTrace = _pst;

    return filename;
  };

  /* This code snippet is responsible for logging messages to the console with specific formatting and
colors based on the label provided. Here's a breakdown of what it does: */
  const origin = _getLogOrigin().split(/[\\/]/).pop();
  const time = new Date().toLocaleTimeString();
  console.log(
    labelColor(`${labelName.padEnd(10, " ")} -> `) +
      chalk.hex("#ffffbf")(`💻 ${config.project.name} ~ `) +
      chalk.grey(`${origin.length > 15 ? origin.substring(0, 17) + "..." : origin}`) +
      " ".repeat(25 - (origin.length > 15 ? 15 : origin.length)) +
      `${chalk.hex("#386ce9")(`[${time}]`)}` +
      `\n  ➜  ${message}`,
  );
}
