const http = require("http");
let started = false;

const server = http.createServer((req, res) => {
  if (req.url.indexOf("/health") === -1) {
    res.write("Route not found");
    res.statusCode = 404;
  }
  if (req.method === "get") {
    res.statusCode = 405;
    res.end("Method not allowed");
  }
  res.statusCode = 200;
  res.end("OK");
  if (!started) {
    started = true;
    JSON.parse("THIS_IS_NOT_JSON");
  }
});

server.listen(3000);
console.log("Server running on port 3000");