// useful - https://codeforgeek.com/handle-get-post-request-express-4/

var WebSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');

var { uuid } = require('uuidv4');

var express = require('express');
var router = express.Router();
var app = express();

var server = require('http').Server(app);

var whosPlaying = {};	// We use this to store useful information keyed by connection id

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

console.log((new Date()) + ' hosting webserver 2.00');
		
function originIsAllowed(origin)
{
	if( ( origin == "http://localhost" ) ||
		( origin == "http://snake.city" ) || 
		( origin == "http://192.168.1.177" ) ) // Your IP address goes here for debugging
	{
		return true;
	}
	return false;
}

function broadcast( messageType, currentState, snake )
{		
    let numPlayers = Object.entries(whosPlaying).length;
	
	var data = { messageType : messageType,
				 currentState : currentState,
				 numPlayers : numPlayers,
				 snake : snake };
	var msg = JSON.stringify(data);
	
	console.log( "Broadcasting message: " + msg );
	
	for (let [key, value] of Object.entries(whosPlaying))
	{
		value[ 'connection' ].send( msg );
	}
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max)
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function padToFour(number) {
  if (number<=9999) { number = ("000"+number).slice(-4); }
  return number;
}

var snakeColours = [ "Blue", "Red", "Black", "Yellow", "White", "Grey", "Purple", "Brown" ];
var snakeNames = [ "Mamba", "Cobra", "Asp", "Adder", "Krait", "Grass snake", "Corn", "Boa", "Copperhead", "Reef snake" ];

// We could just use any unique ID for the snake - but that would be boring
function getSnakeID()
{
	// Calculate the snake name
	var snakeNameIndex = getRandomInt( 0, snakeNames.length - 1 );
	var snakeColourIndex = getRandomInt( 0, snakeColours.length - 1 );	
	var snakeName = snakeNames[snakeNameIndex];
	var snakeColour = snakeColours[snakeColourIndex];
	var snake = snakeColour + " " + snakeName;
	
	// Make up a password
	var passInt = getRandomInt( 0, 9999 );
	var pass = padToFour(passInt);
	
	var snake = { snakeName : snakeColour + " " + snakeName,
				  snakeUuid : uuid(),
				  snakePassword : pass};
	return snake;
}

wsServer.on('request', function(request)
{
	console.log( "New web server request: " + request.origin);
    if (!originIsAllowed(request.origin))
	{
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Attempted connection from origin ' + request.origin + ' rejected.');
      return;
    }

	// Every time the web page is loaded we get a valid connection here
	console.log((new Date()) + ' Connection from origin ' + request.origin);
	
	// Accept the connection
    var connection = request.accept('echo-protocol', request.origin);
		
	// Assign our own ID
	connection.id = uuid();
	
	// Debug this connection
	console.log((new Date()) + ' Connection accepted given id = ' + connection.id);

	// Add a player
	//   adding the connection
	//   add a blank state for them to be filled later
	whosPlaying[connection.id] = { connection : connection,
								   currentState : "",
								   snake: null
								 };
								   
	// Respond to a message
	connection.on('message', function(message)
	{
		// Print out the received message
        console.log('Received Message: ' + message.utf8Data);
		
		var fullMessageData = message.utf8Data;
		
		// Deconstruct the string into strings
 	    var words = fullMessageData.split(" ");

		// Get the command
		var messageCommand = words[0];
		
		// Update the state
		whosPlaying[connection.id]['currentState'] = messageCommand;
				
		if( messageCommand == "new" )
		{				
			// Make a new snake			
			var snakeID = getSnakeID();	
			console.log( "Snake : " + snakeID.snakeName + " " + snakeID.snakePassword );
	
			broadcast( "update", null, snakeID.snakeName );
		}
		if( messageCommand == "join" )
		{				
			broadcast( "update", null, null );
		}		
		if( messageCommand == "waiting" )
		{
			// Check all clients are waiting
			var everyoneWaiting = true;
			
			for (let [key, value] of Object.entries(whosPlaying))
			{
				console.log("State is : " + value['currentState']);
				if( value['currentState'] != "waiting" )
				{
					everyoneWaiting = false;
				}
			}
			
			if( everyoneWaiting )
			{
				broadcast( "state", "connected", null );
			}
			else
			{
				console.log( "Waiting for connections" );
			}
		}
		if( messageCommand == "paused" )
		{
			broadcast( "state", "paused", null );				
		}
		if( messageCommand == "initiated" )
		{
			//Tomo: changing the state of all the connection to initiated on server
			//Maybe better way of doing this?
			for (let [key, value] of Object.entries(whosPlaying))
			{
				value['currentState'] = "initiated"
			}
			broadcast( "state", "initiated", null );	
		}
    });
	
	// Respond to a close event
    connection.on('close', function(reasonCode, description)
	{
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.' + description);
		
		// Delete the connection
		delete whosPlaying[connection.id];
		
		// Tell all the clients someone has left								   
		broadcast( "update", null );
    });
});

app.get('/', (req, res) =>
{
	res.sendFile(__dirname + '/index.html');
});

app.get('/stopwatch.js', (req, res) =>
{
	res.sendFile(__dirname + '/stopwatch.js');
});

app.get('/connect.js', (req, res) =>
{
	if (fs.existsSync(__dirname + '/connectLocalHost.js'))
	{
		////file exists
		console.log("/connect.js => /connectLocalHost.js");
		res.sendFile(__dirname + '/connectLocalHost.js');		
	}
	else
	{
		console.log("Connecting to ws://snake.city");
		res.sendFile(__dirname + '/connect.js');
	}
});

app.get('/Snake.City_PlayBlueprint.pdf', (req, res) =>
{
	res.sendFile(__dirname + '/Snake.City_PlayBlueprint.pdf');
});

app.get('/create.html', (req, res) =>
{
	res.sendFile(__dirname + '/create.html');
});

app.get('/game.css', (req, res) =>
{
	res.sendFile(__dirname + '/game.css');
});

app.get('/logo.png', (req, res) =>
{
	res.sendFile(__dirname + '/logo.png');
});

app.get('/game/:id', function (req, res, next) {
	
	console.log('Request URL:' + req.originalUrl);
	console.log('Request URL:' + req.params.id);

	var data = fs.readFileSync(__dirname + '/game.html', {encoding:'utf8', flag:'r'});
	var newData = data.replace("NEWGAME_OR_JOIN", "join" );
	res.send(newData);
})

app.get('/game', function (req, res, next) {
	
	console.log('Request URL:' + req.originalUrl);

	var data = fs.readFileSync(__dirname + '/game.html', {encoding:'utf8', flag:'r'});
	var newData = data.replace("NEWGAME_OR_JOIN", "new" );
	res.send(newData);
})

app.get('/game.js', (req, res) =>
{
	res.sendFile(__dirname + '/game.js');
});

app.get('/covid.html', (req, res) =>
{
	res.sendFile(__dirname + '/covid.html');
});

app.get('/join.html', (req, res) =>
{
	res.sendFile(__dirname + '/join.html');
});

server.listen(80);