const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { uuid } = require('uuidv4');

server.listen(80);

// This deals with the client connecting to this server
// In response we give it a session id
io.on('connection', (socket) => { 

	socket.on('start-session', function(data)
	{
		// Setup the session
		// This happens when the page is being load
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
		
		// Send the list of snakes to the page
		// Only one page currently responds to this
		var fs = require('fs');

		function readFiles(dirname) {
		  fs.readdir(dirname, function(err, filenames) {
			if (err) {
			  console.log(err);
			  return;
			}
			
			var snakes = "";
			
			filenames.forEach(function(filename) {
				var snakeName = filename.slice(0, -4);
				snakes = snakes + snakeName;
				//console.log(snakeName);
			});
			
			socket.emit("snake-list", { names: snakes })		
		  });
		}

		/// Get the list of games going on
		readFiles( "games" );
	});
});

app.get('/', (req, res) =>
{
	res.sendFile(__dirname + '/intro.html');
});

app.get('/page0.html', (req, res) =>
{
	res.sendFile(__dirname + '/page0.html');
});

app.get('/page1.html', (req, res) =>
{
	res.sendFile(__dirname + '/page1.html');
});

app.get('/page2.html', (req, res) =>
{
	res.sendFile(__dirname + '/page2.html');
});
  

