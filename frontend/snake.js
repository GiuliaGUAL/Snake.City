let head1;
let head2;

let snake_color;
let snake_invisible;
let snake_selected;

let selected;
let elipse_size;

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
  noStroke();

  fill(head1);
  ellipse(windowWidth / 2, 0, elipse_size, elipse_size);

  fill(head2);
  ellipse(windowWidth / 2, windowHeight, elipse_size, elipse_size);
  
  fill(snake_color);
  rect(30, 40, 50, 0); // Draw rectangle
  rect(windowWidth/2 - elipse_size/2, 0, elipse_size, windowHeight);

  fill(100);
  let display = touches.length + " touches";
  text(display, 5, 10);
}

function touchStarted() {
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

function touchEnded() {
  head1 = color(100, 50, 50, 50);
  head2 = color(100, 50, 50, 50);
  snake_color = snake_invisible;
}

//https://p5js.org/reference/#/p5/touches
