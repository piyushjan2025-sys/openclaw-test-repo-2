const http = require("http");
const request = require("supertest");
const server = require("../buggy.js");
const fc = require("fast-check");

describe("HTTP Server Invariants", () => {
  let testServer;

  beforeAll(() => {
    testServer = http.createServer(server);
    testServer.listen(3000);
  });

  afterAll(() => {
    testServer.close();
  });

  test("Non-/health routes never return 200 OK", async () => {
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
            expect(res.status).not.toBe(200);
          });
      })
    );
  });

  test("Non-GET methods never return 200 OK", async () => {
    const nonGetMethods = ["POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"];
    const non200Statuses = [404, 405, 501, 400];

    await Promise.all(
      nonGetMethods.map(async (method) => {
        const response = await request(testServer)
          .post("/health")
          .set("X-Method-Override", method)
          .expect((res) => {
            expect(non200Statuses).toContain(res.status);
          });
      })
    );
  });

  test("/health always returns a valid HTTP response", async () => {
    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"];

    await Promise.all(
      methods.map(async (method) => {
        const response = await request(testServer)
          [method.toLowerCase()]("/health")
          .expect((res) => {
            expect(res.status).toBeGreaterThanOrEqual(100);
            expect(res.status).toBeLessThanOrEqual(599);
            expect(typeof res.text).toBe("string");
            expect(res.headers["content-type"]).toMatch(/text\/plain/);
          });
      })
    );
  });

  test("Server never crashes for arbitrary paths", async () => {
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
      randomPaths.map(async (path) => {
        const response = await request(testServer)
          .get(path)
          .expect((res) => {
            expect(res.status).toBeGreaterThanOrEqual(100);
            expect(res.status).toBeLessThanOrEqual(599);
          });
      })
    );
  });

  test("Status codes are always valid HTTP status codes", async () => {
    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"];
    const paths = ["/health", "/", "/random", "/health?query", "/health#fragment"];

    await Promise.all(
      methods.flatMap(async (method) => {
        return paths.map(async (path) => {
          const response = await request(testServer)
            [method.toLowerCase()](path)
            .expect((res) => {
              expect(res.status).toBeGreaterThanOrEqual(100);
              expect(res.status).toBeLessThanOrEqual(599);
            });
        });
      })
    );
  });

  test("Response body is always a string", async () => {
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
              expect(res.status).toBeGreaterThanOrEqual(100);
              expect(res.status).toBeLessThanOrEqual(599);
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

  test("Server handles concurrent requests correctly", async () => {
    const requests = [];
    
    // Mix of valid and invalid requests
    for (let i = 0; i < 50; i++) {
      const method = fc.oneof(
        fc.constant("GET"),
        fc.constant("POST"),
        fc.constant("PUT"),
        fc.constant("DELETE")
      );
      const path = fc.oneof(
        fc.constant("/health"),
        fc.constant("/"),
        fc.constant("/random"),
        fc.constant("/health?query"),
        fc.constant("/health#fragment")
      );
      
      requests.push(
        request(testServer)
          [method.sample()](path.sample())
          .expect((res) => {
            expect(res.status).toBeGreaterThanOrEqual(100);
            expect(res.status).toBeLessThanOrEqual(599);
          })
      );
    }

    await Promise.all(requests);
  });
});