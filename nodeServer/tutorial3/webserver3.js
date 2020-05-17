const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

//first try the environmental port(for deployment) if not use 80
const port = process.env.PORT || 80

server.listen(port);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/webpage.html');
});

io.on('connection', (socket) => {
  
  console.log("Server has a connection");
   
  // Send to the client
  socket.emit('news', { news: 'hello new client' });
  
  // Receive an event from the client
  socket.on('myevent', (data) => {
    console.log("This data was received by the server from the client:");
	console.log(data);
  });
});