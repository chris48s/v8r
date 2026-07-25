import assert from "node:assert";
import http from "node:http";
import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import { main } from "./index.js";
import { setUp, tearDown, logContainsSuccess } from "./testhelpers.js";

describe("proxy compatibility (global-agent)", function () {
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: { num: { type: "number" } },
  };

  let proxyServer;
  let proxyPort;
  let proxyRequestUrls;

  before(async function () {
    proxyServer = http.createServer((req, res) => {
      proxyRequestUrls.push(req.url);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(schema));
    });
    await new Promise((resolve) => proxyServer.listen(0, "127.0.0.1", resolve));
    proxyPort = proxyServer.address().port;
  });

  after(async function () {
    await new Promise((resolve) => proxyServer.close(resolve));
  });

  beforeEach(function () {
    setUp();
    proxyRequestUrls = [];
  });

  afterEach(function () {
    tearDown();
  });

  it("routes the schema fetch through the proxy configured via GLOBAL_AGENT_HTTP_PROXY", async function () {
    process.env.GLOBAL_AGENT_HTTP_PROXY = `http://127.0.0.1:${proxyPort}`;

    // This host doesn't need to exist/resolve - a genuinely proxied request
    // never contacts it directly, it is only ever sent to our fake proxy.
    const exitCode = await main({
      patterns: ["testfiles/files/valid.json"],
      schema: "http://v8r-proxy-test.invalid/schema.json",
      ignorePatternFiles: [],
    });

    assert.equal(exitCode, 0);
    assert(logContainsSuccess("testfiles/files/valid.json is valid"));
    assert.deepStrictEqual(proxyRequestUrls, [
      "http://v8r-proxy-test.invalid/schema.json",
    ]);
  });
});
