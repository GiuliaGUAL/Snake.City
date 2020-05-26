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
function AddPlayer( socket )
{					
	const index = Object.values(whosPlaying).indexOf(socket.id);
	if (index == -1)
	{
		whosPlaying[socket.id] = { state : "null" };
		
		console.log( "Num playing game: " + GetNumPlayers() );
	}	
		
	socket.emit("peopleInfo", { numPlaying: GetNumPlayers() });	
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
			socket.room = session_id;
			socket.join(socket.room, function(res)
			{
				console.log("Socket id " + socket.id + " joined");
				socket.emit("set-session-acknowledgement", { sessionId: session_id });
				AddPlayer( socket );
			});	
		}
		else
		{
			// Subsequently, we go through this code
			socket.room = data.sessionId;  //this time using the same session 
			socket.join(socket.room, function(res)
			{
				console.log("Socket id " + socket.id + " rejoined");
				socket.emit("set-session-acknowledgement", { sessionId: data.sessionId });
				AddPlayer( socket );
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
		// Update the value directly with the state
		whosPlaying[socket.id] = data;		
	
		// Update the value
		var everyoneWaiting = true;
		
		for (let [key, value] of Object.entries(whosPlaying))
		{
			console.log( "Status: " + value['currentState'] );
			
			if( value['currentState'] != "waiting" )
			{
				everyoneWaiting = false;
			}
		}
		
		if( everyoneWaiting )
		{
			let data = { currentState : "connected" };
			
			// Send to all the other players in the game our keypair variable called 'data'
			socket.emit("snakeEvents", data);
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
  

