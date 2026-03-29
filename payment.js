const http = require("http");
const axios = require("axios");

const server = http.createServer(async (req, res) => {
  if (req.url !== "/pay") {
    res.statusCode = 404;
    res.end("Route not found");
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  try {
    const response = await axios.post("https://payment.example.com/pay", {
      amount: 100
    });
    res.statusCode = 200;
    res.end("Payment successful");
  } catch (err) {
    res.statusCode = 500;
    res.end("Payment failed");
  }
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});