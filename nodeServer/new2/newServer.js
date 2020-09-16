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

var snakeColours = [ "Blue", "Red", "Black", "Yellow", "White", "Grey", "Purple", "Brown", "Orange", "Green", "Brown", "Sandy", "Turquoise" ];

var snakeNames = [ "Mamba", "Cobra", "Asp", "Adder", "Krait", "Grass snake",
				   "Corn", "Boa", "Copperhead", "Reef snake", "Sand adder",
				   "Puff adder", "Anaconda", "Bird snake", "Viper"
				   ];

// We could just use any unique ID for the snake - but that would be boring
function createNewSnakeID()
{
	// Make an interesting snake name
	var snakeNameIndex = getRandomInt( 0, snakeNames.length - 1 );
	var snakeColourIndex = getRandomInt( 0, snakeColours.length - 1 );	
	var snakeName = snakeNames[snakeNameIndex];
	var snakeColour = snakeColours[snakeColourIndex];
	var snake = snakeColour + " " + snakeName;
	
	// Make up a password
	var passInt = getRandomInt( 0, 9999 );
	var pass = padToFour(passInt);
	
	var snake = { snakeUuid : uuid(),
				  snakeName : snakeColour + " " + snakeName,
				  snakePassword : pass,
				  numPlayers : 1};
	return snake;
}

// Get a list of snakes from the running games
// JSONify this and send it to the clients
function sendListOfSnakes( connection )
{
	var snakeIds = [];				
	for (let [key, value] of Object.entries(whosPlaying))
	{
		let snake = value['snake'];
		
		snakeIds.push( snake.snakeUuid );
	}
	
	// Make this list unique
	uniqueSnakes = [];
	var uniqueIds = snakeIds.filter((v, i, a) => a.indexOf(v) === i); 	

	for (let [uniqueKey, uniqueSnake] of Object.entries(uniqueIds))			
	{
		for (let [key, value] of Object.entries(whosPlaying))
		{
			let snake = value['snake'];
	
			if( snake.snakeUuid == uniqueSnake )
			{
				snake.numPlayers = getPlayersInSnake( snake );
				uniqueSnakes.push( snake );
				break;
			}		
		}					
	}
	
	// Send this to the asking client
	var msg = JSON.stringify(uniqueSnakes);

	// Send the list of snakes down this connection. Note we are not adding ourselves to the main array
	// until we join a snake
	connection.send( msg );	
}

// Count the players in any given snake
function getPlayersInSnake( snake )
{	
	// Count the number of players in this snake. We will always send this information
	let numPlayers = 0;
	
	for (let [key, value] of Object.entries(whosPlaying))
	{
		if( snake.snakeUuid == value['snake'].snakeUuid )
		{
			++numPlayers;
		}
	}
	return numPlayers;
}

// Send a message to a particular snake
function sendToSnake( snake, messageType, currentState )
{	
	// Make our message packet
	var data = { messageType : messageType,
				 currentState : currentState,
				 numPlayers : getPlayersInSnake( snake ),
				 snake : snake.snakeName,
				 snakeUuid : snake.snakeUuid,
				 snakePass : snake.snakePassword };
				 
	var msg = JSON.stringify(data);
	
	console.log( "Broadcasting to snake: " + snake.snakeName + "message: " + msg );
	
	// Only send to our snake
	for (let [key, value] of Object.entries(whosPlaying))
	{
		if( snake.snakeUuid == value['snake'].snakeUuid )
		{
			value[ 'connection' ].send( msg );
		}
	}
}

// Get which snake someone belongs to from their connection
function getSnakeFromConnection( connection )
{
	// Is there an entry for this connection
	let whoAmI = whosPlaying[connection.id];
	
	// If there is - return the snake
	if( whoAmI != null )
	{
		// Get my snake
		let mySnake = whoAmI['snake'];
		
		// Return my snake
		return mySnake;
	}	
	return null;
}

// Update state of a snake
function setStateOfSnake( snake, newState )
{
	// Update this snake only
	for (let [key, value] of Object.entries(whosPlaying))
	{
		if( snake.snakeUuid == value['snake'].snakeUuid )
		{
			value['currentState'] = newState;
		}
	}
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
		
	// Assign our own ID against the connection. This is held against the 
	connection.id = uuid();
	
	// Debug this connection
	console.log((new Date()) + ' Connection accepted given id = ' + connection.id);
	
	// For all new connections - send the list of snakes
	sendListOfSnakes( connection );
	
	// Respond to a message
	connection.on('message', function(message)
	{
		// Does this connection have a snake?
		let mySnake = getSnakeFromConnection( connection );

		console.log("\r\n");
		
		var fullMessageData = message.utf8Data;
		
		// Deconstruct the string into strings
 	    var words = fullMessageData.split(" ");

		// Get the command
		var messageCommand = words[0];		
		
		// This creates a new snake
		// It assigns the connection - a null game state and the snake name
		if( messageCommand == "new" )
		{				
			// Make a new snake			
			mySnake = createNewSnakeID();
			
			console.log( "Creating new snake: " + mySnake.snakeUuid + " " + mySnake.snakeName + " " + mySnake.snakePassword );
			
			// Create a new player
			whosPlaying[connection.id] = { connection : connection,
										   currentState : null,
										   snake: mySnake
										 };
												
			sendToSnake( mySnake, "update", null );
		}
		
		// If we want to join an existing snake we need to find that snake
		// We then create a new entry for a new connection, set the game state to null and assign them to the snake
		if( messageCommand == "join" )
		{				
			let snakeId = words[1];
			let password = words[2];
			
			console.log( "Looking for snake: " + snakeId + " " + password );

			// Find a snake
			for (let [key, value] of Object.entries(whosPlaying))
			{
				if( value['snake'] != "null" )
				{
					let foundSnake = value['snake'];
					
					if( foundSnake.snakeUuid == snakeId )
					{
						console.log( "Found uuid: " + snakeId );
						
						if( foundSnake.snakePassword == password )
						{
							console.log( "Matched password: " + password );
							mySnake = foundSnake;
							break;
						}
						else
						{
							console.log( "Did not match password :" + password + " with snake password " + foundSnake.snakePassword );
						}
					}
				}
			}			
			
			if( mySnake == null )
			{				
				// Make a new snake	instead		
				mySnake = createNewSnakeID();	

				// There are no snakes in the system. Make a new snake instead
				console.log( "Couldn't join snake.\nCreating new snake: " +
							mySnake.snakeUuid + " " +
							mySnake.snakeName + " " +
							mySnake.snakePassword );
			}
			
			// Create a new player
			whosPlaying[connection.id] = { connection : connection,
										   currentState : null,
										   snake: mySnake
										 };
							
			// Broadcast the snake names
			sendToSnake( mySnake, "update", null );		
		}		
				
		
		if( messageCommand == "initiated" )
		{
			console.log( "Reseting everyone in this snake" );
			
			setStateOfSnake( mySnake, "initiated" );
			
			sendToSnake( mySnake, "state", "initiated" );		
		}
				
		if( messageCommand == "waiting" )
		{
			console.log( "messageCommand: " + messageCommand );
			console.log( "snake: " + mySnake.snakeUuid );
			
			// Update the state of just me
			whosPlaying[connection.id]['currentState'] = messageCommand;

			// Check all clients are waiting
			var everyoneWaiting = true;
			
			for (let [key, value] of Object.entries(whosPlaying))
			{
				//console.log( "found snake: " + key + " " + value['snake'].snakeUuid + " = " + value['currentState']);
				
				// Only check people waiting in my snake
				if( mySnake.snakeUuid == value['snake'].snakeUuid )
				{
					if( value['currentState'] != "waiting" )
					{
						everyoneWaiting = false;
					}
				}
			}
			
			if( everyoneWaiting )
			{
				sendToSnake( mySnake, "state", "connected" );		
			}
			else
			{
				console.log( "Waiting for connections" );
			}
		}
				
		// This is called when we are waiting for the game to restart - or someone has let go of their phone
		// force all the players to the new state - paused
		if( messageCommand == "paused" )
		{
			sendToSnake( mySnake, "state", "paused" );				
		}	
    });
	
	// Respond to a close event
    connection.on('close', function(reasonCode, description)
	{
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.' + description);
		
		if( whosPlaying[connection.id] )
		{
			let snake = whosPlaying[connection.id]['snake'];

			// Delete the connection from the array
			delete whosPlaying[connection.id];
			
			// Tell all the clients someone has left - this sends a null state so it's not acted on							   
			sendToSnake( snake, "update", null );
		}		
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

app.get('/snakebg.png', (req, res) =>
{
	res.sendFile(__dirname + '/snakebg.png');
});

app.get('/eulogo.png', (req, res) =>
{
	res.sendFile(__dirname + '/eulogo.png');
});

app.get('/snakeOGP.png', (req, res) =>
{
	res.sendFile(__dirname + '/snakeOGP.png');
});

app.get('/fleuronregular-webfont.woff', (req, res) =>
{
	res.sendFile(__dirname + '/fleuronregular-webfont.woff');
});

app.get('/fleuronregular-webfont.woff2', (req, res) =>
{
	res.sendFile(__dirname + '/fleuronregular-webfont.woff2');
});

app.get('/fleuronregular-ios.ttf', (req, res) =>
{
	res.sendFile(__dirname + '/fleuronregular-ios.ttf');
});

app.get('/game/:id/:password', function (req, res, next) {
	
	console.log('Join snake\nRequest URL:' + req.originalUrl);
	console.log('Req params:' + req.params.id + " " + req.params.password);

	var data = fs.readFileSync(__dirname + '/game.html', {encoding:'utf8', flag:'r'});
	var newData = data.replace("NEWGAME_OR_JOIN", "join " + req.params.id + " " + req.params.password);
	res.send(newData);
})

app.get('/game', function (req, res, next) {
	
	console.log('New snake\nRequest URL:' + req.originalUrl);

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