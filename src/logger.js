import chalk from "chalk";

class Logger {
  constructor(verbosity = 0) {
    this.stderr = [];
    this.stdout = [];
    this.verbosity = verbosity;
  }

  setVerbosity(verbosity) {
    this.verbosity = verbosity;
  }

  writeOut(message) {
    process.stdout.write(message + "\n");
  }

  writeErr(message) {
    process.stderr.write(message + "\n");
  }

  resetStderr() {
    this.stderr = [];
  }

  resetStdout() {
    this.stdout = [];
  }

  log(message) {
    this.stdout.push(message);
    this.writeOut(message);
  }

  info(message) {
    const formatedMessage = chalk.blue.bold("ℹ ") + message;
    this.stderr.push(formatedMessage);
    this.writeErr(formatedMessage);
  }

  debug(message) {
    const formatedMessage = chalk.blue.bold("ℹ ") + message;
    this.stderr.push(formatedMessage);
    if (this.verbosity === 0) {
      return;
    }
    this.writeErr(formatedMessage);
  }

  warning(message) {
    const formatedMessage = chalk.yellow.bold("▲ ") + message;
    this.stderr.push(formatedMessage);
    this.writeErr(formatedMessage);
  }

  error(message) {
    const formatedMessage = chalk.red.bold("✖ ") + message;
    this.stderr.push(formatedMessage);
    this.writeErr(formatedMessage);
  }

  success(message) {
    const formatedMessage = chalk.green.bold("✔ ") + message;
    this.stderr.push(formatedMessage);
    this.writeErr(formatedMessage);
  }
}

const logger = new Logger();
export default logger;
