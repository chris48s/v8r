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

const logging = { cleanup, init };
export default logging;
