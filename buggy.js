const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    if (req.method === "GET") {
      res.statusCode = 200;
      res.end("OK");
    } else {
      res.statusCode = 405;
      res.end("Method not allowed");
    }
  } else {
    res.statusCode = 404;
    res.end("Route not found");
  }
});

server.listen(3000);
console.log("Server running on port 3000");