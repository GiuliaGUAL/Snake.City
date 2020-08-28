
const STATE = {
	'HELLO': 'hello',
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

var ws;

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
const phoneNumText = document.getElementById("phoneNum");
const instructionText = document.getElementById("instruction");
const restartButton = document.getElementById("restartButton");

//Importing stopwatch function stopwatch.js
const watch = new Stopwatch(timer);

//this makes sure startup() runs when the page is loaded
document.addEventListener("DOMContentLoaded", startup);

function startup() {
    buttonA.style.backgroundColor = "#D3D3D3";
    buttonB.style.backgroundColor = "#D3D3D3";

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
}

//Function that is called when restart button is pressed at the end.
//restartGame is triggered in the HTML
function restartGame() {
    currentSTATE = STATE.INITIATE;
    ws.send(currentSTATE);
    renderGame(currentSTATE);
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

    switch (currentSTATE) {
        //Initial screen, when some button is pressed, state goes to start.
        case STATE.INITIATE:
            {
                if (currentBUTTON == BUTTON.A || currentBUTTON == BUTTON.B) {
                    currentSTATE = STATE.START;
                }
            }
            break;

        //
        case STATE.START:
            if (currentBUTTON == BUTTON.BOTH) {
                currentSTATE = STATE.WAIT;
            }
            break;

        case STATE.WAIT:
            // do nothing - this is triggered by the server
            break;

        case STATE.CONNECTED:
            if (currentSTATE == STATE.CONNECTED) {
                if (currentBUTTON == BUTTON.A || currentBUTTON == BUTTON.B) {
                    currentSTATE = STATE.PAUSED;
                }
            }
            break;
    }

    if (lastSTATE != currentSTATE) {
        ws.send(currentSTATE);
    }

    //Calls rendergame which deals with how the screen display is handled
    renderGame(currentSTATE);
}

function onOpen( socket )
{
	console.log("onOpen(socket)");
	ws.send(FirstCommand);
}

function onMessage(e) {
    if (typeof e.data === 'string') {
        console.log("Received from server: " + e.data);

        var object = JSON.parse(e.data);

        if (object['messageType'] == "update") {
            updatePlayers(object);
        }
        else if (object['messageType'] == "state") {
            currentSTATE = object['currentState'];			// Update our state
        }
        renderGame(currentSTATE);
    }
};

function updatePlayers(object) {

	var numPlayers = object['numPlayers'];
	var snakeName = object['snake'];
	var snakePass = object['snakePass'];
	
    console.log("People info: " + numPlayers);

    //Change colors based on the number of people.
    let colorchange = numPlayers * 60;
    buttonA.style.backgroundColor = `hsl(${colorchange},100%,50%)`;
    buttonB.style.backgroundColor = `hsl(${colorchange},100%,50%)`;
    rectangle.style.backgroundColor = `hsl(${colorchange},80%,50%)`;
	if( numPlayers == 1 )
	{
		phoneNum.innerHTML = snakeName + " is " + numPlayers + " player long. Use password: " + snakePass;
	}
	else
	{
		phoneNum.innerHTML = snakeName + " is " + numPlayers + " players long. Use password: " + snakePass;
	}
}

function renderGame(state) {

    switch (state) {
        case STATE.INITIATE:
            //currently handling all the restart related handling here.
            //might need to make a separate function for ease of use later
            A_pressed = false;
            B_pressed = false;
            currentBUTTON = BUTTON.NONE;
            buttonA.classList.remove("active");
            buttonB.classList.remove("active");
            watch.reset();
            restartButton.style.display = "none";
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
            rectangle.classList.add("blink");
            watch.start();
            break;

        case STATE.PAUSED:
            instructionText.innerHTML = "GAME OVER";
            rectangle.classList.remove("visible");
            rectangle.classList.remove("blink");
            restartButton.style.display = "inline-block";
            watch.stop();
            break;

        default:
        // code block
    }
    debugText.innerHTML = "currentBUTTON: " + currentBUTTON;
    stateText.innerHTML = "currentSTATE: " + currentSTATE;
}

