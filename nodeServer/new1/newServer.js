var WebSocketServer = require('websocket').server;
var http = require('http');
const { uuid } = require('uuidv4');
const app = require('express')();
const server = require('http').Server(app);

const clients = new Set();

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});
 
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request)
{
    if (!originIsAllowed(request.origin))
	{
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
	
	// Assign our own ID
	connection.id = uuid();
	
	console.log((new Date()) + ' Connection accepted. id=' + connection.id);
		
	// Add the connection
	clients.add(connection);

	// Send a message to all the clients
	for(let client of clients)
	{
		client.send("Number of clients = " + clients.size);
	}
	
	connection.send( " = " + clients.size);
		 
	// Respond to a message
	connection.on('message', function(message)
	{
        if (message.type === 'utf8')
		{
           console.log('Received Message: ' + message.utf8Data + " from " + connection.remoteAddress);
        }
    });
	
	// Respond to a close event
    connection.on('close', function(reasonCode, description)
	{
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
		
		// Delete the connection
		clients.delete(connection);
    });
});

app.get('/', (req, res) =>
{
	res.sendFile(__dirname + '/game.html');
});

app.get('/game.html', (req, res) =>
{
	res.sendFile(__dirname + '/game.html');
});

server.listen(80);
