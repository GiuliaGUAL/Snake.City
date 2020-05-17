let head1;
let head2;

let snake_color;
let snake_invisible;
let snake_selected;

let selected;
let elipse_size;

let buttonStateText = 'ko';

//State Switcher

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

let buttonA = false;
let buttonB = false;
let consoleis = "noneyet"

let CURRENT_STATE = STATE.INITIATE
let CURRENT_BUTTON = BUTTON.NONE

//setup() is called initially
function setup() {
  createCanvas(windowWidth, windowHeight);
  head1 = color(100, 50, 50, 50);
  head2 = color(50, 100, 20, 50);
  selected = color(255, 100, 100);
  
  snake_color = color(50, 100, 20, 0);
  snake_invisible = color(0, 0, 0, 0);
  snake_selected = color (50, 120, 90, 100,);
  elipse_size = 200;
}

//calls commands continously
function draw() {

  clear();
  background(255);
  noStroke();

  fill(head1);
  ellipse(windowWidth / 2, 0, elipse_size, elipse_size);

  fill(head2);
  ellipse(windowWidth / 2, windowHeight, elipse_size, elipse_size);
  
  fill(snake_color);
  rect(30, 40, 50, 0); // Draw rectangle
  rect(windowWidth/2 - elipse_size/2, 0, elipse_size, windowHeight);

  fill(100);
  buttonStateText = "buttonA: " + buttonA + "- buttonB:" + buttonB + "  touches.length" + touches.length;
  text(buttonStateText, 20, 10);
  text("CURRENT_BUTTON : " + CURRENT_BUTTON, 20, 30);
  text("CURRENT_TIME : null ", 20, 50);
}

function buttonUpdate(){
  if(!buttonA && !buttonB){
    CURRENT_BUTTON = BUTTON.NONE;
  }
  else if (buttonA && buttonB){
    CURRENT_BUTTON = BUTTON.BOTH;
  }
  else if (buttonA && !buttonB){
    CURRENT_BUTTON = BUTTON.A;
  }
  else {
    CURRENT_BUTTON = BUTTON.B;
  }
}

function touchStarted() {

  for(let i = 0; i < touches.length ; i++){
      if(touches[i].y < windowHeight/2){
        buttonA = true;
      }else if(touches[i].y > windowHeight/2){
        buttonB = true;
      }
  }
  buttonUpdate();


  if (mouseY < windowHeight / 2) {
    head1 = selected;
    //snake_color = snake_selected;

  } else {
    head1 = color(100, 50, 50, 50);
  }

  if (mouseY > windowHeight / 2) {
    head2 = selected;
    //snake_color = snake_selected;
  } else {
    head2 = color(100, 50, 50, 50);
  }
  
  if(touches.length >= 2){
    snake_color = snake_selected;
  }
  else{
    snake_color = snake_invisible;
  }
  return false;
}

function touchEnded(event) {
  for(let i = 0; i < event.changedTouches.length ; i++){
    
    let goneTouch = event.changedTouches[i].clientY;
    console.log(goneTouch);
    if(goneTouch < windowHeight/2){
      buttonA = false;
    }else if(goneTouch > windowHeight/2){
      buttonB = false;
    }
  }
  buttonUpdate();
  consoleis = event.changedTouches[0].clientY;

  head1 = color(100, 50, 50, 50);
  head2 = color(100, 50, 50, 50);
  snake_color = snake_invisible;
}

//https://p5js.org/reference/#/p5/touches
