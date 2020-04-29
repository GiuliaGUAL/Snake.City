const app = require('express')();
const server = require('http').Server(app);

server.listen(80);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/webserver2.html');
});
