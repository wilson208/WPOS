var express = require("express");
var app = express();

app.get("/test", function(req, res) {
  res.send(JSON.stringify({ id: 1, name: "Wilson" }));
});

app.listen(3000);
