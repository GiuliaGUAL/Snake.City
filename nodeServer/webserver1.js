var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

//first try the environmental port(for deployment) if not use 80
const port = process.env.PORT || 80


app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

http.listen(port, () => {
  console.log('listening on port:' + port);
});