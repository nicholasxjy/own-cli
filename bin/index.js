#!/usr/bin/env node

const { Command } = require("commander");
const pkg = require("../package.json");
const run = require("./cli");

function main() {
  const program = new Command();

  program
    .version(`own-cli version ${pkg.version}`)
    .usage("<command> [options]");

  program
    .description("add ownership to files in project")
    .option("-c, --change", "change ownership in files")
    .option("-d, --dir <directory>", "set directory to add")
    .option("-o, --owner <names>", "set owners(shanks or shanks,luffy)")
    .option("-t, --team <team>", "set team code(Y1)")
    .option("-r, --remove", "remove all ownership in files")
    .action(run);

  program.parse(process.argv);
}

main();
