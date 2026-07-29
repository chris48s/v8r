import assert from "node:assert";
import { spawn } from "node:child_process";
import http from "node:http";
import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import { clearCacheById } from "flat-cache";
import { setUp, tearDown, testCacheName } from "./testhelpers.js";

describe("proxy compatibility", function () {
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
      const url = new URL(req.url, `http://${req.headers.host}`);
      proxyRequestUrls.push(url.href);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(schema));
    });

    proxyServer.on("connect", (req, clientSocket, head) => {
      clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      if (head && head.length) clientSocket.unshift(head);
      proxyServer.emit("connection", clientSocket);
    });

    await new Promise((resolve) => proxyServer.listen(0, "127.0.0.1", resolve));

    proxyPort = proxyServer.address().port;
  });

  after(async function () {
    await new Promise((resolve) => proxyServer.close(resolve));
    clearCacheById(testCacheName);
  });

  beforeEach(function () {
    setUp();
    proxyRequestUrls = [];
  });

  afterEach(function () {
    tearDown();
  });

  it("routes the schema fetch through the proxy configured via HTTP_PROXY", async function () {
    const child = await spawn(
      process.execPath,
      [
        "src/index.js",
        "testfiles/files/valid.json",
        "--schema",
        "http://v8r-proxy-test.invalid/schema.json",
        "--cache-ttl",
        "0",
      ],
      {
        env: {
          ...process.env,
          HTTP_PROXY: `http://127.0.0.1:${proxyPort}`,
          NODE_USE_ENV_PROXY: "1",
        },
      },
    );

    const exitCode = await new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("close", resolve);
    });

    assert.equal(exitCode, 0);
    assert.deepStrictEqual(proxyRequestUrls, [
      "http://v8r-proxy-test.invalid/schema.json",
    ]);
  });
});
