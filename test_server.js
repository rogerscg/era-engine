const express = require('express');
const http = require('http');

const port = process.env.PORT || 5000;
const app = express();
app.use(express.static(__dirname));
const server = http.createServer(app);
server.listen(port);
