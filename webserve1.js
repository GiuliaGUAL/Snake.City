var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Snake.City');
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

http.listen(80, () => {
  console.log('listening on *:80');
});