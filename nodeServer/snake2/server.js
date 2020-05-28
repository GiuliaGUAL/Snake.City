const app = require('express')();
const server = require('http').Server(app);
// https://socket.io/docs/server-api/
const io = require('socket.io')(server);
const { uuid } = require('uuidv4');

var hbeat = new Array();
var whosPlaying = {};

server.listen(80);

// GetNumPlayers
// Gets how many players are joined
function GetNumPlayers()
{
	return Object.keys(whosPlaying).length;
}

// AddPlayer
// Maintain a list of whosPlaying
function AddPlayer( socket, session_id )
{	
	// Remove any old session - because this will have a different socket	
	for (let [key, value] of Object.entries(whosPlaying))
	{
		if( value['session_id'] == session_id )
		{
			console.log( "Deleted old session" );
			delete whosPlaying[key];
		}
	}
	
	// Add the player against their socket with their session				
	const index = Object.values(whosPlaying).indexOf(socket.id);
	if (index == -1)
	{
		whosPlaying[socket.id] = { session_id : session_id };
		console.log( "Num playing game: " + GetNumPlayers() );
	}	

    //Everytime, there is a new person, broadcast it
	socket.emit("peopleInfo", { numPlaying: GetNumPlayers() });	
	socket.broadcast.to("SINGLE_ROOM").emit("peopleInfo", { numPlaying: GetNumPlayers() });
}

// This deals with the client connecting to this server
// In response we give it a session id
io.on('connection', (socket) => { 
	
	// This handles someone closing their browser and refresh pages
	// If I refresh page this code lets me keep the same socket address and information
	socket.on('start-session', function(data)
	{		
		// This is what happens the first time
		if (data.sessionId == null)
		{
			var session_id = uuid();
			socket.room = "SINGLE_ROOM";
			socket.join(socket.room, function(res)
			{
				console.log("Socket id " + socket.id + " joined for the first time");
				socket.emit("set-session-acknowledgement", { sessionId: session_id });
				AddPlayer( socket, session_id );
			});	
		}
		else
		{
			// Subsequently, we go through this code
			socket.room = "SINGLE_ROOM";
			socket.join(socket.room, function(res)
			{
				console.log("Socket id " + socket.id + " rejoined");
				socket.emit("set-session-acknowledgement", { sessionId: data.sessionId });
				AddPlayer( socket, session_id );
			})
		}
    });
	
	// Check who's left the playing list every so often - here every - 5s
	var myVar = setInterval(myTimer, 5000);

	function myTimer()
	{
		// Loop through all the players that are connected
		for (let [key, value] of Object.entries(whosPlaying))
		{
			//console.log( "Checking activity of " + key + " of " + GetNumPlayers() + " players" );
			
			// Ignore anyone who has been away for more than 6 seconds
			var now = Date.now();
			if (now - hbeat[key] > 4000) // 4 seconds
			{
				delete whosPlaying[key];
				console.log( "Num playing: " + GetNumPlayers() + " after removing " + socket.id );
				
				//emit peopleInfo to update the decreased number
				socket.broadcast.to("SINGLE_ROOM").emit("peopleInfo", { numPlaying: GetNumPlayers() });
				//socket.emit("peopleInfo", { numPlaying: GetNumPlayers() });

			}
		}
	}

	// respond to a heartbeat by setting a new time for when we last heard from them
	socket.on('heartbeat', (data) =>
	{
		//console.log( "Heartbeat: " + socket.id );
		
		// Update the last time we heard from someone
		hbeat[socket.id] = Date.now();
	});

// respond to the current state coming in	
	socket.on('snakeEvents', (data) =>
	{	
		console.log( "Snake event received: " + data['currentState'] );
		
		// Update the value directly with the state
		whosPlaying[socket.id] = data;		
	
		// Look to see if everyone's waiting to start
		{
			var everyoneWaiting = true;
			
			for (let [key, value] of Object.entries(whosPlaying))
			{
				//console.log( "Status: " + value['currentState'] );
				
				if( value['currentState'] != "waiting" )
				{
					everyoneWaiting = false;
				}
			}
			
			if( everyoneWaiting )
			{
				console.log( "Sending start to everyone" );
				
				let data = { currentState : "connected" };
				
				// Send to all the other players in the game our keypair variable called 'data'
				socket.broadcast.to("SINGLE_ROOM").emit("snakeEvents", data);
				
				// Ad us
				socket.emit("snakeEvents", data);
			}
		}
		
		// Look to see if anyone has paused
		{
			var anyonePaused = false;
			
			for (let [key, value] of Object.entries(whosPlaying))
			{
				//console.log( "Status: " + value['currentState'] );				
				if( value['currentState'] == "paused" )
				{
					anyonePaused = true;
				}
			}
			
			if( anyonePaused )
			{
				console.log( "Sending pause to everyone" );
				
				let data = { currentState : "paused" };
				
				// Send to all the other players in the game our keypair variable called 'data'
				socket.broadcast.to("SINGLE_ROOM").emit("snakeEvents", data);
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
  

