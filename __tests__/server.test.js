const http = require("http");
const request = require("supertest");
const server = require("../buggy.js");

describe("HTTP Health Check Server", () => {
  let testServer;

  beforeAll(() => {
    testServer = http.createServer(server);
    testServer.listen(3000);
  });

  afterAll(() => {
    testServer.close();
  });

  test("GET /health returns 200 and OK", async () => {
    const response = await request(testServer)
      .get("/health")
      .expect(200);
    
    expect(response.text).toBe("OK");
  });

  test("POST /health returns 405 Method not allowed", async () => {
    const response = await request(testServer)
      .post("/health")
      .expect(405);
    
    expect(response.text).toBe("Method not allowed");
  });

  test("GET / returns 404 Route not found", async () => {
    const response = await request(testServer)
      .get("/")
      .expect(404);
    
    expect(response.text).toBe("Route not found");
  });

  test("GET /health should not crash the server", async () => {
    const response = await request(testServer)
      .get("/health")
      .expect(200);
    
    expect(response.text).toBe("OK");
  });

  test("Server starts without errors", () => {
    expect(testServer.listening).toBe(true);
  });
});