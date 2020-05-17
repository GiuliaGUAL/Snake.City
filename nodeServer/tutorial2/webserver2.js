const app = require('express')();
const server = require('http').Server(app);

//first try the environmental port(for deployment) if not use 80
const port = process.env.PORT || 80

server.listen(port);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/webserver2.html');
});
