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
		
// These are abitary stuff we can send to the webpage client in real time

// After socket.on we are guaranteed for the client to read this
		
// demonstrate with a counter		
		socket.emit("counter", { mycounter: 11 })	
	});
});

// These lines serve the index page and other pages

app.get('/', (req, res) =>
{
	res.sendFile(__dirname + '/page0.html');
});


app.get('/page1.html', (req, res) =>
{
	res.sendFile(__dirname + '/page1.html');
});

  

