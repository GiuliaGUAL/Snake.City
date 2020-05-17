const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(80);

app.get('/', (req, res) => {
  //console.log("Req: " + req);

  res.sendFile(__dirname + '/page1.html');
});

app.get('/page2.html', (req, res) => {
  //console.log("Req: " + req);

  res.sendFile(__dirname + '/page2.html');
});

io.on('connection', (socket) =>
{  
  console.log("Server has a connection");
   
  // Send to the client
  socket.emit('news', { news: 'hello new client' });
  
  // Receive an event from the client
  socket.on('myevent', (data) =>
  {
    console.log("This data was received by the server from the client:");
	console.log(data);
  });
});
