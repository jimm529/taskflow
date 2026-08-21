const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../src/app");

const getJson = (url) => {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let rawBody = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        rawBody += chunk;
      });
      response.on("end", () => {
        resolve({
          statusCode: response.statusCode,
          body: JSON.parse(rawBody),
        });
      });
    });

    request.setTimeout(3000, () => {
      request.destroy(new Error("Health check timed out"));
    });
    request.on("error", reject);
  });
};

test("GET /api/v1/health returns API status", async () => {
  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, () => resolve(listeningServer));
  });

  try {
    const { port } = server.address();
    const response = await getJson(`http://127.0.0.1:${port}/api/v1/health`);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, "TaskFlow API is running");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
