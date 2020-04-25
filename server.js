const WebSocketServer = require('ws').Server,
  express = require('express'),
  https = require('https'),
  app = express(),
  fs = require('fs');

const pkey = fs.readFileSync('./ssl/key.pem'),
  pcert = fs.readFileSync('./ssl/cert.pem'),
  options = {
    key: pkey,
    cert: pcert,
    passphrase: '123456789'
  };
var wss = null,
  sslSrv = null;


app.use(express.static('public'));
app.use(function (req, res, next) {
  if (req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});

sslSrv = https.createServer(options, app).listen(443);
console.log("The HTTPS server is up and running");

wss = new WebSocketServer({
  server: sslSrv
});

console.log("WebSocket Secure server is up and running.");

wss.on('connection', function (client) {
  console.log("A new WebSocket client was connected.");
  client.on('message', function (message) {
    wss.broadcast(message, client);
  });
});

wss.broadcast = function (data, exclude) {
  var i = 0,
    n = this.clients ? this.clients.length : 0,
    client = null;
  if (n < 1) {
    return;
  }
  console.log("Broadcasting message to all " + n + " WebSocket clients.");
  for (; i < n; i++) {
    client = this.clients[i];
    if (client === exclude) {
      continue;
    }
    if (client.readyState === client.OPEN) {
      client.send(data);
    } else {
      console.error('Error: the client state is ' + client.readyState);
    }
  }
};