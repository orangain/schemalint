/* eslint-disable unicorn/prefer-module */
/* eslint-disable unicorn/no-process-exit */
import chalk from "chalk";
// @ts-ignore
import optionator from "optionator";
import path from "path";

import { processDatabase } from "./engine";
// @ts-ignore
const { version } = require("../package.json");

async function main() {
  const o = optionator({
    prepend: "Usage: schemalint [options]",
    append: `Version ${version}`,
    options: [
      {
        option: "help",
        alias: "h",
        type: "Boolean",
        description: "displays help",
      },
      {
        option: "version",
        alias: "v",
        type: "Boolean",
        description: "displays version",
      },
      {
        option: "config",
        alias: "c",
        type: "path::String",
        description:
          "Use this configuration, overriding .schemalintrc.* config options if present",
      },
    ],
  });

  let options;

  try {
    options = o.parseArgv(process.argv);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  if (options.help) {
    console.info(o.generateHelp());
    process.exit(0);
  }

  if (options.version) {
    console.info(version);
    process.exit(0);
  }

  console.info(`${chalk.greenBright("schema-lint")}`);
  const configFile = path.join(
    process.cwd(),
    options.config || ".schemalintrc.js",
  );

  try {
    const config = require(configFile);
    const exitCode = await processDatabase(config);
    process.exit(exitCode);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
