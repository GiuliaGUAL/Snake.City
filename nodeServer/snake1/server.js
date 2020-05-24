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

	// This handles someone closing their browser and refresh pages
	// If I refresh page this code lets me keep the same socket address and information
	socket.on('start-session', function(data)
	{		
		// This is what happens the first time
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
				whosPlaying.push(socket);											// List of players called whosplaying - to make this useful for the game
				console.log( "Num playing: " + whosPlaying.length );
			}				
		}
		else
		{
			// Subsequently, we go through this code
			socket.room = data.sessionId;  //this time using the same session 
			socket.join(socket.room, function(res)
			{
				console.log("Client joined a session")
				socket.emit("set-session-acknowledgement", { sessionId: data.sessionId })
				console.log( "Num playing: " + whosPlaying.length );
			})
		}
		
		socket.emit("peopleInfo", { numPlaying: whosPlaying.length});
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
			if (now - hbeat[socket.id] > 6000) // 6 seconds
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
					
					socket.emit("peopleInfo", { numPlaying: whosPlaying.length});
				}
				catch (error)
				{
					console.log(error)
				}
			}
			now = null;
		}, 6000);
	});

// respond to the current state coming in	
	socket.on('snakeEvents', (data) =>
	{		
	// At the moment we will only respond to Paused on the server
	// but really we need all of them in some form
		if( data['currentState'] == 'paused' ) // that access the keypair by what we are looking for - which is "currentState"
		{
			console.log("currentState");
			console.log(data);

			// Loop through all the players that are connected
			whosPlaying.forEach(myFunction); // this calls myfunction
			
			// As we loop it uses this function
			function myFunction(playersSocket)
			{
				// This stops us telling ourselves that we have changed
				if( playersSocket != socket )
				{
					// Send out on playerssocket - not socket (because thats the player that let go)
					console.log("Telling other player " + playersSocket.id + " someone let go of their phone");
					
					// Send to all the other players in the game our keypair variable called 'data'
					playersSocket.emit("snakeEvents", data);
				}
			}
		}
	});
});

// This bit of code sends HTML to the browser
// But we also need the Javascript as well
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
  

