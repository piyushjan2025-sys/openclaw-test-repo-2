const http = require("http");
const server = http.createServer((req, res) => {
  if (req.url !== "/health") {
    res.statusCode = 404;
    res.end("Route not found");
    return;
  }
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }
  res.statusCode = 200;
  res.end("OK");
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});