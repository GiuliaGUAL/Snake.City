const app = require('express')();
const server = require('http').Server(app);
// https://socket.io/docs/server-api/
const io = require('socket.io')(server);
const { uuid } = require('uuidv4');

var hbeat = new Array();
var whosPlaying = new Array();

server.listen(80);

// This deals with the client connecting to this server
// In response we give it a session id
io.on('connection', (socket) => { 
	
	//setTimeout(() => socket.disconnect(true), 5000);

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
				console.log("Client connected on socket id: " + socket.id)
				socket.emit("set-session-acknowledgement", { sessionId: session_id })		
			});
			
			// Add them to a list of whos playing
			const index = whosPlaying.indexOf(socket.id);
			if (index == -1) {
				whosPlaying.push(socket);
				console.log( "Num playing: " + whosPlaying.length );
			}				
		}
		else
		{
			socket.room = data.sessionId;  //this time using the same session 
			socket.join(socket.room, function(res)
			{
				console.log("Client joined a session")
				socket.emit("set-session-acknowledgement", { sessionId: data.sessionId })
				console.log( "Num playing: " + whosPlaying.length );
			})
		}
    });

// Disconnect code. If we want to check that we have a client continually connected
// We need to keep pinging this server and then set up code to disconnect if we don't receive that ping
	socket.on('heartbeat', function()
	{
		//console.log('Heartbeat received');
		hbeat[socket.id] = Date.now();
		setTimeout(function()
		{
			var now = Date.now();
			if (now - hbeat[socket.id] > 5000)
			{
				try
				{
					// client is not responding
					// we can't force a disconnect yet - but we can remove them from the game
					// remove them from the list of whos playing
					const index = whosPlaying.indexOf(socket);
					if (index > -1)
					{
						whosPlaying.splice(index, 1);
						console.log( "Num playing: " + whosPlaying.length + " after removing " + socket.id );				  
					}
				}
				catch (error)
				{
					console.log(error)
				}
			}
			now = null;
		}, 6000);
	});
		
// demonstrate more arbitary stuff with a counter		
		//socket.emit("counter", { mycounter: 11 })	

// respond to game start		
	socket.on('currentState', (data) =>
	{		
		if( data['currentState'] == 'paused' )
		{
			console.log("currentState");
			console.log(data);

			// Look to see if there is a disconnect - if there is
			// then set the state on all the other players
			whosPlaying.forEach(myFunction);
			function myFunction(playersSocket)
			{
				if( playersSocket != socket )
				{
					// Send out on playerssocket - not socket (because thats the player that let go)
					console.log("Telling other player " + playersSocket.id + " someone let go of their phone");
					playersSocket.emit("currentState", data)
				}
			}
		}
	});
});

app.get('/', (req, res) =>
{
	res.sendFile(__dirname + '/game.html');
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
  

