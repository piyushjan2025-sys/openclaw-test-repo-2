const http = require("http");
const request = require("supertest");
const server = require("../buggy.js");
const fc = require("fast-check");

describe("HTTP Health Check Server Invariants", () => {
  let testServer;

  beforeAll(() => {
    testServer = http.createServer(server);
    testServer.listen(3000);
  });

  afterAll(() => {
    testServer.close();
  });

  // CHUNK 1: GET /health must always return HTTP 200 and body "OK"
  test("GET /health must always return HTTP 200 and body 'OK'", async () => {
    const response = await request(testServer)
      .get("/health")
      .expect(200);
    
    expect(response.text).toBe("OK");
  });

  // CHUNK 2: /health with any non-GET method must never return 200
  test("/health with any non-GET method must never return 200", async () => {
    const nonGetMethods = ["POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"];
    
    await Promise.all(
      nonGetMethods.map(async (method) => {
        const response = await request(testServer)
          [method.toLowerCase()]("/health")
          .expect((res) => {
            expect(res.status).not.toBe(200);
          });
      })
    );
  });

  // CHUNK 3: Any non-/health route must always return 404
  test("Any non-/health route must always return 404", async () => {
    const nonHealthRoutes = [
      "/",
      "/invalid",
      "/health/extra",
      "/health?query=1",
      "/health#fragment",
      "/health/path",
      "/some-random-path",
      "/api/v1/health",
      "/health-check",
      "/status"
    ];

    await Promise.all(
      nonHealthRoutes.map(async (route) => {
        const response = await request(testServer)
          .get(route)
          .expect((res) => {
            expect(res.status).toBe(404);
          });
      })
    );
  });

  // CHUNK 4: Server must always send a response
  test("Server must always send a response", async () => {
    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"];
    const paths = ["/health", "/", "/random", "/health?query", "/health#fragment"];

    await Promise.all(
      methods.flatMap(async (method) => {
        return paths.map(async (path) => {
          const response = await request(testServer)
            [method.toLowerCase()](path)
            .expect((res) => {
              expect(res.status).toBeDefined();
              expect(res.text).toBeDefined();
            });
        });
      })
    );
  });

  // CHUNK 5: Response body must always be a string
  test("Response body must always be a string", async () => {
    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"];
    const paths = ["/health", "/", "/random", "/health?query", "/health#fragment"];

    await Promise.all(
      methods.flatMap(async (method) => {
        return paths.map(async (path) => {
          const response = await request(testServer)
            [method.toLowerCase()](path)
            .expect((res) => {
              expect(typeof res.text).toBe("string");
            });
        });
      })
    );
  });

  // CHUNK 6: Server must not crash for arbitrary URLs or HTTP methods
  test("Server must not crash for arbitrary URLs or HTTP methods", async () => {
    const randomMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"];
    const randomPaths = [
      "/",
      "/random",
      "/health?invalid",
      "/health#fragment",
      "/health/path",
      "/api/health",
      "/v1/health",
      "/status/health",
      "/health-check",
      "/health/"
    ];

    await Promise.all(
      randomMethods.flatMap(async (method) => {
        return randomPaths.map(async (path) => {
          const response = await request(testServer)
            [method.toLowerCase()](path)
            .expect((res) => {
              expect(res.status).toBeDefined();
              expect(res.text).toBeDefined();
            });
        });
      })
    );
  });

  // CHUNK 7: Server is stateless - one request does not affect another
  test("Server is stateless - one request does not affect another", async () => {
    const initialResponse = await request(testServer)
      .get("/health")
      .expect(200);
    
    expect(initialResponse.text).toBe("OK");

    // Make many random requests
    const randomMethods = ["POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"];
    const randomPaths = ["/", "/random", "/health?invalid", "/health#fragment", "/health/path"];

    await Promise.all(
      randomMethods.flatMap(async (method) => {
        return randomPaths.map(async (path) => {
          await request(testServer)
            [method.toLowerCase()](path)
            .expect((res) => {
              expect(res.status).toBeDefined();
              expect(res.text).toBeDefined();
            });
        });
      })
    );

    // Verify /health still works the same
    const finalResponse = await request(testServer)
      .get("/health")
      .expect(200);
    
    expect(finalResponse.text).toBe("OK");
  });
});