const app = require('express')();
const server = require('http').Server(app);
// https://socket.io/docs/server-api/
const io = require('socket.io')(server);
const { uuid } = require('uuidv4');

var stateCount = 0;

server.listen(80);

// This deals with the client connecting to this server
// In response we give it a session id
io.on('connection', (socket) => { 
	
	//setTimeout(() => socket.disconnect(true), 5000);

	socket.on('start-session', function(data)
	{
		stateCount = 0;
		
		// Setup the session
		// This happens when the page is being load
		if (data.sessionId == null)
		{
			var session_id = uuid();
			socket.room = session_id;
			socket.join(socket.room, function(res)
			{
				console.log("Client connected")
				socket.emit("set-session-acknowledgement", { sessionId: session_id })
			});
		}
		else
		{
			socket.room = data.sessionId;  //this time using the same session 
			socket.join(socket.room, function(res)
			{
				console.log("Client joined a session")
				socket.emit("set-session-acknowledgement", { sessionId: data.sessionId })
			})
		}
		
// These are abitary stuff we can send to the webpage in real time
		
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
		
// demonstrate with a counter		
		socket.emit("counter", { mycounter: 11 })	

// respond to game start		
		socket.on('currentState', (data) => {
			++stateCount;
			console.log("stateCount:" + stateCount);
			console.log("currentState");
			console.log(data);
		});
	});
});

// Handling disconnect
// https://stackoverflow.com/questions/17287330/socket-io-handling-disconnect-event
io.on('disconnect', (socket) => { 
	console.log("Client disconnected")
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

app.get('/game.html', (req, res) =>
{
	res.sendFile(__dirname + '/game.html');
});

app.get('/game.css', (req, res) =>
{
	res.sendFile(__dirname + '/game.css');
});

app.get('/game.js', (req, res) =>
{
	res.sendFile(__dirname + '/game.js');
});

app.get('/stopwatch.js', (req, res) =>
{
	res.sendFile(__dirname + '/stopwatch.js');
});
  

