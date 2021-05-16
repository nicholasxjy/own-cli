const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const babelParser = require("@babel/parser");
const babelGenerator = require("@babel/generator");
const babelTraverse = require("@babel/traverse");
const babelTypes = require("@babel/types");
const config = require("./config");

function walkSync(dir, options) {
  const files = fs.readdirSync(dir);
  files.forEach((f) => {
    const filepath = path.join(dir, f);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, options);
    } else if (stats.isFile()) {
      // add banner
      insertOwnershipToFile(filepath, options);
    }
  });
}

function insertOwnershipToFile(file, { team, owner, change, remove }) {
  const ext = path.extname(file);
  if (config.extensions.includes(ext.slice(1))) {
    console.log(chalk.blue(`start processing ${file}`));
    const content = `*\n * @Owner ${owner}\n * @Team ${team}\n `;
    const fileData = fs.readFileSync(file, { encoding: "utf8" });
    const ast = babelParser.parse(fileData, {
      sourceType: "module",
      plugins: ["jsx", "tsx"],
    });

    babelTraverse.default(ast, {
      enter(path) {
        if (!change && !remove) {
          if (path.node.type === "Program") {
            babelTypes.addComment(path.node, "leading", content);
          }
        }
        if (change) {
          if (path.node.leadingComments && path.node.leadingComments.length) {
            path.node.leadingComments.forEach((v) => {
              if (v.value.includes("@Owner") || v.value.includes("@Team")) {
                v.value = content;
              }
            });
          }
          if (path.node.trailingComments && path.node.trailingComments.length) {
            path.node.trailingComments.forEach((v) => {
              if (v.value.includes("@Owner") || v.value.includes("@Team")) {
                v.value = content;
              }
            });
          }
        }
        if (remove) {
          if (path.node.leadingComments && path.node.leadingComments.length) {
            path.node.leadingComments = path.node.leadingComments.filter(
              (v) => !v.value.includes("@Owner")
            );
          }
          if (path.node.trailingComments && path.node.trailingComments.length) {
            path.node.trailingComments = path.node.trailingComments.filter(
              (v) => !v.value.includes("@Owner")
            );
          }
        }
      },
    });
    const output = babelGenerator.default(ast, {});
    fs.writeFileSync(file, output.code, {
      encoding: "utf8",
    });
    console.log(chalk.green(`finish processing ${file}`));
  }
}

module.exports = function (c) {
  const { dir, team, owner, change = false, remove = false } = c;
  let rootPath = process.cwd();
  if (change && remove) {
    console.log(chalk.red("you can not set -c,-r option in same time"));
    process.exit(1);
  }
  if (!remove) {
    if (!team || !owner) {
      console.log(chalk.red("-t or -o option should be set"));
      process.exit(1);
    }
  }
  if (!dir) {
    console.log(chalk.blue(`no -d option, so use ${process.cwd()}`));
  } else {
    rootPath = path.resolve(rootPath, dir);
  }
  console.log(rootPath);
  walkSync(rootPath, { team, owner, change, remove });
};
