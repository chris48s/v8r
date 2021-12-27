import chalk from "chalk";

const origWarn = console.warn;
const origInfo = console.info;
const origDebug = console.debug;

function init(verbosity) {
  if (verbosity === 0) {
    console.warn = function () {};
    console.info = function () {};
    console.debug = function () {};
  }
  // TODO: implement multiple log levels if/when you need them
}

function cleanup() {
  console.warn = origWarn;
  console.info = origInfo;
  console.debug = origDebug;
}

function info(message) {
  console.log(chalk.blue.bold("ℹ ") + message);
}

function debug(message) {
  console.debug(chalk.blue.bold("ℹ ") + message);
}

function error(message) {
  console.error(chalk.red.bold("✖ ") + message);
}

function success(message) {
  console.log(chalk.green.bold("✔ ") + message);
}

const logging = { cleanup, init, info, debug, error, success };
export default logging;
