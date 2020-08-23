
	ws = new WebSocket("ws://snake.city", "echo-protocol");

    ws.onopen = function ()
	{
      console.log("Connected to server")
	
	  // Register for the message before we open the socket
	  ws.addEventListener("message", function(e) {
		  onMessage( e );
	  } );
	  
	  // We don't need to register an event to call our onOpen code
	  onOpen();		 
	}
