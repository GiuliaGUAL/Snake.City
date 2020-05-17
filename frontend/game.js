
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

let A_pressed = false;
let B_pressed = false;
let connected = false;

let currentSTATE = STATE.INITIATE;
let currentBUTTON = BUTTON.NONE;

const buttonA = document.getElementById("buttonA");
const buttonB = document.getElementById("buttonB");
const debugText = document.getElementById("debugText");
const stateText = document.getElementById("stateText");

//this makes sure startup() runs when the page is loaded
document.addEventListener("DOMContentLoaded", startup);


function startup() {
    buttonA.addEventListener("touchstart", touchStartA, false);
    buttonA.addEventListener("touchend", touchEndA, false);
    buttonA.addEventListener("touchcancel", touchEndA, false);

    buttonB.addEventListener("touchstart", touchStartB, false);
    buttonB.addEventListener("touchend", touchEndB, false);
    buttonB.addEventListener("touchcancel", touchEndB, false);
    buttonStateUpdate();
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
        connected = true;
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
    debugText.innerHTML = "currentBUTTON: " + currentBUTTON;
    //Calls the state manager
    stateManage();
}

function stateManage() {
    //Changes state based on if the two screens have connected or not.
    if (!connected) {
        if (currentBUTTON == BUTTON.A || currentBUTTON ==BUTTON.B) {
            currentSTATE = STATE.START;
        }
        else {
            currentSTATE = STATE.INITIATE;
        }
    }

    if (connected) {
        if (currentBUTTON === BUTTON.BOTH) {
            currentSTATE = STATE.CONNECTED;
        }
        else {
            currentSTATE = STATE.PAUSED;
        }
    }
    stateText.innerHTML = "currentSTATE: " + currentSTATE;
}

