
    //ws = new WebSocket("ws://localhost", "echo-protocol");
	ws = new WebSocket("ws://192.168.1.177", "echo-protocol");

    ws.onopen = function ()
	{
      console.log("Connected to server")
		
	  // We don't need to register an event to call our onOpen code
	  onOpen();
		  
	  ws.addEventListener("message", function(e) {
		  onMessage( e );
	  } );
	}