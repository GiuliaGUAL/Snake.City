
const STATE = {
    'INITIATE': 'initiated',
    'START': 'started',
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

//returns if the user has connected or not
let has_connected = false;

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
        has_connected = true;
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
    //Changes state based on if the two screens have has_connected or not.
    if (!has_connected) {
        if (currentBUTTON == BUTTON.A || currentBUTTON == BUTTON.B) {

            currentSTATE = STATE.START;
        }
        else {
            currentSTATE = STATE.INITIATE;
        }
    }

    if (has_connected) {
        if (currentBUTTON === BUTTON.BOTH) {
            currentSTATE = STATE.CONNECTED;
        }
        else {

            currentSTATE = STATE.PAUSED;
			socket.emit("currentState", { currentState: currentSTATE });
        }
    }

    //Calls rendergame which deals with how the screen display is handled
    renderGame(currentSTATE);
}

// Respond to someone disconnecting
socket.on("currentState", function(data) {
	console.log("Someone disconnected" + data);
	currentSTATE = STATE.PAUSED;
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

