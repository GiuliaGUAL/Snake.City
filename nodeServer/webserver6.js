const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { uuid } = require('uuidv4');

server.listen(80);

app.get('/', (req, res) => {
  //console.log("Req: " + req);

  res.sendFile(__dirname + '/webserver6_intro.html');
});

app.get('/webserver6_page0.html', (req, res) => {
  //console.log("Req: " + req);

  res.sendFile(__dirname + '/webserver6_page0.html');
});

app.get('/webserver6_page1.html', (req, res) => {
  //console.log("Req: " + req);

	var fs = require('fs');

	function readFiles(dirname) {
	  fs.readdir(dirname, function(err, filenames) {
		if (err) {
		  console.log(err);
		  return;
		}
		filenames.forEach(function(filename) {
			var snakeName = filename.slice(0, -4);
			console.log(snakeName);
		});
	  });
	}

	readFiles( "games" );

	res.sendFile(__dirname + '/webserver6_page1.html');
});

app.get('/webserver6_page2.html', (req, res) => {

	res.sendFile(__dirname + '/webserver6_page2.html');
});
  
// This deals with the client connecting to this server
// In response we give it a session id
io.on('connection', (socket) => { 

	socket.on('start-session', function(data)
	{
		if (data.sessionId == null)
		{
			var session_id = uuid();
			socket.room = session_id;
			socket.join(socket.room, function(res)
			{
				console.log("joined room for first time")
				socket.emit("set-session-acknowledgement", { sessionId: session_id })
			});
		}
		else
		{
			socket.room = data.sessionId;  //this time using the same session 
			socket.join(socket.room, function(res)
			{
				console.log("joined successfully ")
				socket.emit("set-session-acknowledgement", { sessionId: data.sessionId })
			})
		}
	});
});

