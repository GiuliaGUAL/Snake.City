
const STATE = {
    'INITIATE': 'initiated',
    'START': 'started',
	'WAIT': 'waiting',
    'CONNECTED': 'connected',
    'PAUSED': 'paused',
    'FINISHED': 'finished',
}

const BUTTON = {
    'A': 'A',
    'B': 'B',
    'BOTH': 'BOTH',
    'NONE': 'NONE'
}

//This states below might be useful in sending via socket io
let currentSTATE = STATE.INITIATE;
let currentBUTTON = BUTTON.NONE;

//for getting button pressed state
let A_pressed = false;
let B_pressed = false;

const buttonA = document.getElementById("buttonA");
const buttonB = document.getElementById("buttonB");
const rectangle = document.getElementById("rectangle");
const debugText = document.getElementById("debugText");
const stateText = document.getElementById("stateText");
const instructionText = document.getElementById("instruction");

//Importing stopwatch function stopwatch.js
const watch = new Stopwatch(timer);


//this makes sure startup() runs when the page is loaded
document.addEventListener("DOMContentLoaded", startup);


function startup() {
    buttonA.addEventListener("touchstart", touchStartA, false);
    buttonA.addEventListener("touchend", touchEndA, false);
    buttonA.addEventListener("touchcancel", touchEndA, false);

    buttonB.addEventListener("touchstart", touchStartB, false);
    buttonB.addEventListener("touchend", touchEndB, false);
    buttonB.addEventListener("touchcancel", touchEndB, false);

	// For testing add mouse handlers - but don't handle the cancel
	// this allows us to test the game by clicking on one button
	// then clicking on the other button
	// to simulate them letting go - click on that particular button again
	buttonA.addEventListener("mousedown", touchStartA, false);
	buttonA.addEventListener("mouseup", touchEndA, false);
	buttonB.addEventListener("mousedown", touchStartB, false);
	buttonB.addEventListener("mouseup", touchEndB, false);
	
    buttonStateUpdate();
    //touchCancel handles a case where the users finger has slipped to the browser etc...
    //buttonA.addEventListener("touchmove", handleMove, false);
}

function touchStartA(event) {
    event.preventDefault();
    A_pressed = true;
    buttonStateUpdate();
}

function touchStartB(event) {
    event.preventDefault();
    B_pressed = true;
    buttonStateUpdate();
}

function touchEndA(event) {
    event.preventDefault();
    A_pressed = false;
    buttonStateUpdate();
}

function touchEndB(event) {
    event.preventDefault();
    B_pressed = false;
    buttonStateUpdate();
}

function buttonStateUpdate() {
    if (!A_pressed && !B_pressed) {
        currentBUTTON = BUTTON.NONE;
        buttonA.classList.remove("active");
        buttonB.classList.remove("active");
    }
    else if (A_pressed && B_pressed) {
        currentBUTTON = BUTTON.BOTH;
        buttonA.classList.add("active");
        buttonB.classList.add("active");
    }
    else if (A_pressed && !B_pressed) {
        currentBUTTON = BUTTON.A;
        buttonA.classList.add("active");
        buttonB.classList.remove("active");
    }
    else {
        currentBUTTON = BUTTON.B;
        buttonA.classList.remove("active");
        buttonB.classList.add("active");
    }
    //Calls the state manager
    stateManage();
}

function stateManage() {

	var lastSTATE = currentSTATE;

	if (currentBUTTON == BUTTON.A || currentBUTTON == BUTTON.B)
	{
		currentSTATE = STATE.START;
	}
	
	if (currentBUTTON == BUTTON.BOTH)
	{
		currentSTATE = STATE.WAIT;
	}
	
	if( lastSTATE != currentSTATE )
	{
		// Send to the server here - so the server knows what each phone has done
		socket.emit("snakeEvents", { currentState: currentSTATE });			   
	}
			
    //Calls rendergame which deals with how the screen display is handled
    renderGame(currentSTATE);
}

socket.on("peopleInfo", function(data) {
	
	console.log("People info: " + data["numPlaying"] );
});


socket.on("snakeEvents", function(data) {
	
	console.log( data );
	
    // Now call the render function to update whats happened
    renderGame(currentSTATE);
});

function renderGame(state) {
    debugText.innerHTML = "currentBUTTON: " + currentBUTTON;
    stateText.innerHTML = "currentSTATE: " + currentSTATE;
    switch (state) {
        case STATE.INITIATE:
            instructionText.innerHTML = "Press both sides!";
            break;
        case STATE.START:
            instructionText.innerHTML = "Touch the other side!";
            break;

        case STATE.WAIT:
            instructionText.innerHTML = "Wait for others";
            rectangle.classList.add("visible");
            break;
			
        case STATE.CONNECTED:
            instructionText.innerHTML = "Hold it!!";
            rectangle.classList.add("visible");
            watch.start();
            break;

        case STATE.PAUSED:
            instructionText.innerHTML = "GAME OVER";
            rectangle.classList.remove("visible");
            watch.stop();
            break;

        default:
        // code block
    }
}

