
	var ws = new WebSocket("ws://snake.city", "echo-protocol");

    ws.onopen = function () {
      console.log("Connected to server")
    };
	