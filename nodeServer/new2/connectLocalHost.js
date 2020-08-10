
    var ws = new WebSocket("ws://localhost", "echo-protocol");

    ws.onopen = function () {
      console.log("Connected to server")
    };
	