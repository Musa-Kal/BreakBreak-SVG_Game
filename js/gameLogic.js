/**
 * gameLogic.js
 * 
 * 
 * @author Musa Kaleem
 */

const svgNS = "http://www.w3.org/2000/svg";


// Setting up the vars for the brick break game
let frameInterval;

let score = 0;
let bounces = 0;

// Time each frame should be updated in
const FrameUpdateTime = 1000 / 125;

const frameHeight = 340;
const frameWidth = 300;

let paddleIntVelocity = 3; 

// Paddle object
let paddle = {
    velocity : paddleIntVelocity,
    x : frameWidth / 2,
    y : frameHeight - 30, 
    height : Math.floor(frameHeight / 60), 
    width : Math.floor(frameWidth / 5), 
    id : "playerPaddle",
    color : "limegreen"
}


let ballIntVelocity = 1; 

// Ball object
let ball = {
    velocityX : ballIntVelocity,
    velocityY : ballIntVelocity,
    x : frameWidth / 2,
    y : frameHeight - 40,
    r : Math.floor((frameHeight*frameWidth) / 22500),
    id : "bBall",
    color : "blue"
}


const brickFristX = 25;
const brickFristY = 25;
const brickSpacing = 2;
let brickCols = 10;
let brickRows = 8;

// Brick object contaning skeleton info for the bricks
let brickStat = {
    id : "brick",
    color : "red",
    height : Math.floor(frameHeight / 60), 
    width : Math.floor((frameWidth - brickFristX * 2 - ((brickCols - 1) * brickSpacing)) / brickCols),
}

// Array to hold the bricks that are rendered on the screen
let bricks = [];


// Elements that will be rendered on the screen

// Background rect element
let backgroundRect = document.createElementNS(svgNS, "rect")
backgroundRect.setAttribute("x", 0);
backgroundRect.setAttribute("rx", 10);
backgroundRect.setAttribute("y", 0);
backgroundRect.setAttribute("width", frameWidth);
backgroundRect.setAttribute("height", frameHeight);
backgroundRect.setAttribute("fill", "lightgrey");

// Player Paddle element
let paddleEle = document.createElementNS(svgNS, "rect");
paddleEle.setAttribute("width", paddle.width);
paddleEle.setAttribute("height", paddle.height);
paddleEle.setAttribute("fill", paddle.color);
paddleEle.setAttribute("id", paddle.id);

// Bouncing ball element
let ballEle = document.createElementNS(svgNS, "circle");
ballEle.setAttribute("r", ball.r);
ballEle.setAttribute("fill", ball.color);
ballEle.setAttribute("id", ball.id);


/**
 * Function to setup the page once it is loaded for the first time
 */
window.onload = function() {

    paddle.x -= paddle.width / 2;

    ball.x -= ball.r;

    slider = document.getElementById("sliderInput");
    slider.style.width = (frameWidth - paddle.width) + "px";
    slider.min = 0;
    slider.max = (frameWidth - paddle.width);
    slider.value = paddle.x;

    display = document.getElementById("gameDisplay");
    display.style.width = frameWidth + "px";
    display.style.height = frameHeight + "px";

    let svgEle = document.createElementNS(svgNS, "svg");
    svgEle.setAttribute("id", "frame");

    display.appendChild(svgEle);
    
    controls = document.getElementById("gameControls");
    controls.style.width = frameWidth + "px";


    frame = document.getElementById("frame");
    frame.setAttribute("width", frameWidth);
    frame.setAttribute("height", frameHeight);


    frame.appendChild(backgroundRect)

    bricks = makeBricks();

    // Adding all the bricks to the svg
    for (var b of bricks) {
        var brickEle = document.createElementNS(svgNS, "rect");
        brickEle.setAttribute("width", b.width);
        brickEle.setAttribute("height", b.height);
        brickEle.setAttribute("fill", b.color);             
        brickEle.setAttribute("id", b.id);
        brickEle.setAttribute("x", b.x);
        brickEle.setAttribute("y", b.y);
        frame.appendChild(brickEle);
    }

    
    paddleEle.setAttribute("x", paddle.x);
    paddleEle.setAttribute("y", paddle.y);
    frame.appendChild(paddleEle);

    ballEle.setAttribute("cx", ball.x);
    ballEle.setAttribute("cy", ball.y);
    frame.appendChild(ballEle);

    frame.appendChild(brickEle);

}

/**
 * Function that updates all the elements and checks for collision each frame
 */
function updateFrame() {

        // Checking for the types on input and assigning it.
        if (system["useSlider"]) {
            paddle.x = parseInt(document.getElementById("sliderInput").value);
        }
        else {
            if (keyState["ArrowLeft"]) {
                paddle.x = Math.max(paddle.x - paddle.velocity, 0);
            }
            else if (keyState["ArrowRight"]) {
                paddle.x = Math.min(paddle.x + paddle.velocity, frameWidth - paddle.width);
            }
        }

        document.getElementById(paddle.id).setAttribute("x", paddle.x);
    
        ball.x = ball.x + ball.velocityX
        ball.y = ball.y + ball.velocityY
    
        document.getElementById(ball.id).setAttribute("cx", ball.x);
        document.getElementById(ball.id).setAttribute("cy", ball.y);
    
        // Cheching for out of bounds or game border collision
        if (ball.x - ball.r <= 0 || ball.x + ball.r >= frameWidth) {
            ball.velocityX = -ball.velocityX;
            inscrementBounce();
        }
        if (ball.y - ball.r <= 0) {
            ball.velocityY = -ball.velocityY;
            inscrementBounce();
        }
        else if (ball.y + ball.r >= frameHeight) {
            if (system["godMode"]){
                ball.velocityY = -ball.velocityY;
                inscrementBounce();
            }
            else {
                resetGame();
            }
        }
    
        // checking for collision with the paddle
        if (topCollision(ball, paddle)) {
            ball.velocityY = -Math.abs(ball.velocityY);
            inscrementBounce();
        }
        else if (bottomCollision(ball, paddle)) {
            ball.velocityY = Math.abs(ball.velocityY);
            inscrementBounce();
        }

        if (rightCollision(ball, paddle)) {
            ball.velocityX = Math.abs(ball.velocityX);
            inscrementBounce();
        }
        else if (leftCollision(ball, paddle)) {
            ball.velocityX = -Math.abs(ball.velocityX);
            inscrementBounce();
        }

        var unbrokenBricks = [];

        // Checking for collision with each brick on the screen
        for (var b of bricks) {
            if (topCollision(ball, b) || bottomCollision(ball, b) || 
            rightCollision(ball, b) || leftCollision(ball, b)) {

                if (topCollision(ball, b)) {
                    ball.velocityY = -Math.abs(ball.velocityY);
                }
                else if (bottomCollision(ball, b)) {
                    ball.velocityY = Math.abs(ball.velocityY);
                }
    
                if (rightCollision(ball, b)) {
                    ball.velocityX = Math.abs(ball.velocityX);
                }
                else if (leftCollision(ball, b)) {
                    ball.velocityX = -Math.abs(ball.velocityX);
                }

                inscrementScore(10);
                inscrementBounce();
                frame.removeChild(document.getElementById(b.id));

            }
            else {

                unbrokenBricks.push(b)

            }

            bricks = unbrokenBricks;
        }

        // Checing if there are no bricks left and godmode is off for end game popup
        if ((!system["godMode"]) && bricks.length <= 0){
            finishGame();
        }

        // updating score and bounce stat
        updateOnScreenStats()
}


/**
 * Function returns either -1 or 1 at random
 * 
 * @returns {int} either -1 or 1
 */
function chooseRandomDirection() {
    let directions = [1, -1];

    return directions[Math.min(Math.floor(Math.random()*2), 1)];
}


/**
 * Function that reset all the elements on the screen, mostly same as the onload function
 */
function resetGame() {
    if (frameInterval != null) {
        clearInterval(frameInterval)
    }

    keyState["ArrowLeft"] = false;
    keyState["ArrowRight"] = false;

    resetStats();

    ball.velocityX = ballIntVelocity * chooseRandomDirection();
    ball.velocityY = ballIntVelocity * chooseRandomDirection();

    
    ball.r = Math.floor((frameHeight*frameWidth) / 22500);
    ball.x = (frameWidth / 2) - ball.r;
    ball.y = frameHeight - 40;


    paddle.velocity = paddleIntVelocity;
    paddle.height = Math.floor(frameHeight / 60);
    paddle.width = Math.floor(frameWidth / 5);
    paddle.x = (frameWidth / 2) - (paddle.width / 2);
    paddle.y = frameHeight - 30;

    document.getElementById("sliderInput").value = paddle.x;

    brickStat.width = Math.floor((frameWidth - brickFristX * 2 - ((brickCols - 1) * brickSpacing)) / brickCols);

    display = document.getElementById("gameDisplay");
    // deleting every thing from the svg parent node
    display.innerHTML = "";

    // adding the svg back to the parent node
    svgEle = document.createElementNS(svgNS, "svg");
    svgEle.setAttribute("width", frameWidth);
    svgEle.setAttribute("height", frameHeight);
    svgEle.setAttribute("id", "frame");
    display.appendChild(svgEle);

    // Code for setting up the svg below
    frame = document.getElementById("frame");
    frame.setAttribute("height",frameHeight);
    frame.setAttribute("width", frameWidth);

    frame.appendChild(backgroundRect)

    bricks = makeBricks();

    for (var b of bricks) {
        var brickEle = document.createElementNS(svgNS, "rect");
        brickEle.setAttribute("width", b.width);
        brickEle.setAttribute("height", b.height);
        brickEle.setAttribute("fill", b.color);             
        brickEle.setAttribute("id", b.id);
        brickEle.setAttribute("x", b.x);
        brickEle.setAttribute("y", b.y);
        frame.appendChild(brickEle);
    }

    
    paddleEle.setAttribute("x", paddle.x);
    paddleEle.setAttribute("y", paddle.y);
    frame.appendChild(paddleEle);

    ballEle.setAttribute("cx", ball.x);
    ballEle.setAttribute("cy", ball.y);
    frame.appendChild(ballEle);

    frame.appendChild(brickEle);


    // starting the up the game
    frameInterval = setInterval(updateFrame, FrameUpdateTime)
}


/**
 * Function to bring up the end game popup and pause the game
 */
function finishGame() {
    system["pause"] = true;
    pauseGame();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('endGamePopUp')).show();
}


/**
 * function takes a parameter and multiplies it by ball velocity, than adds it to the var score
 * 
 * @param {int} val 
 */
function inscrementScore(val) {
    score += (val * ballIntVelocity);
}


/**
 * function add 1 to the var bounce
 *
 */
function inscrementBounce() {
    bounces++;
}

/**
 * Function set score and bouces to 0
 */
function resetStats() {
    score = 0;
    bounces = 0;
}


/**
 * Function updates the stats on the screen
 */
function updateOnScreenStats() {
    document.getElementById("scoreAmount").innerText = score;

    document.getElementById("bouncesAmount").innerText = bounces;
}

/**
 * Function returns boolean based on if the val is in between in the min and max value inclusive
 * 
 * @param {float} val 
 * @param {float} min 
 * @param {float} max 
 * @returns {boolean} min <= val <= max
 */
function verifyValue(val, min, max) {
    return ((min <= val) && (val <= max))
}

/**
 * Functions assigns according values from the index.html inputs to the vars and resets the game
 */
function updateValsandResetGame() {

    let ballVelInput = document.getElementById("ballVelocitySlider").value;
    let paddleVelInput = document.getElementById("paddleVelocitySlider").value;
    let rowInput = document.getElementById("rowAmountInput").value;
    let colInput = document.getElementById("colAmountInput").value;
    
    if (ballVelInput != null ) {
        ballIntVelocity = Math.max(parseInt(ballVelInput), 0.25);
    }
    
    if (paddleVelInput != null) {
        paddleIntVelocity = parseInt(paddleVelInput);
    }

    if (rowInput != null && rowInput != '' && verifyValue(parseInt(rowInput), 1, 30)) {
        brickRows = parseInt(rowInput);
    }
    
    if (colInput != null && colInput != '' && verifyValue(parseInt(colInput), 1, 50)) {
        brickCols = parseInt(colInput);
    }
   
    resetGame();
}


/**
 * Function makes the individual brick object and adds them in a list and returns the list
 * 
 * @returns {Object []} Array of brick object
 */
function makeBricks() {
    var tempBricks = [];
    var count = 1;

    for (var row=0; row<brickRows; row++){

        for (var col=0; col<brickCols; col++){

            var currBrick = {
                id : brickStat.id + count,
                color : brickStat.color,
                x : brickFristX + (brickStat.width * col) + (brickSpacing * col),
                y : brickFristY + (brickStat.height * row) + (brickSpacing * row),
                height : brickStat.height, 
                width : brickStat.width
            }

            tempBricks.push(currBrick);
            count++;
        }
    }

    return tempBricks;
}

/**
 * Function set system["pause"] to false and resumes the game
 */
function resumeGame() {
    system["pause"] = false;
    pauseGame();
}

/**
 * Functions pasues and resumes the game based on the system["pause"] key
 */
function pauseGame() {
    if (!system["pause"]) {
        if (frameInterval != null) {
            clearInterval(frameInterval);
        }
        frameInterval = setInterval(updateFrame, FrameUpdateTime);
        slider = document.getElementById("sliderInput").disabled = false;
    }
    else {
        clearInterval(frameInterval);
        slider = document.getElementById("sliderInput").disabled = true;
    }
}


/**
 * Functions checks if ball will collide on the left side of the object, 
 * functions checks collision by check the position of the ball relative
 * to the object and checks if the x and y values of the ball and object
 * intercept and returns a boolean based on the if the collions detected. 
 * 
 * @param {Object} ball
 * @param {Object} obj 
 * @returns {boolean}
 */
function leftCollision(ball, obj) {
    return (
        ball.x < obj.x &&
        ball.y >= obj.y &&
        ball.y <= (obj.y + obj.height) &&
        (ball.x + ball.r) >= obj.x
    )
}


/**
 * Functions checks if ball will collide on the top side of the object, 
 * functions checks collision by check the position of the ball relative
 * to the object and checks if the x and y values of the ball and object
 * intercept and returns a boolean based on the if the collions detected. 
 * 
 * @param {Object} ball
 * @param {Object} obj 
 * @returns {boolean}
 */
function topCollision(ball, obj) {
    return (
        ball.y < obj.y &&
        ball.x >= obj.x &&
        ball.x <= (obj.x + obj.width) && 
        (ball.y + ball.r) >= obj.y 
    )
}



/**
 * Functions checks if ball will collide on the right side of the object, 
 * functions checks collision by check the position of the ball relative
 * to the object and checks if the x and y values of the ball and object
 * intercept and returns a boolean based on the if the collions detected. 
 * 
 * @param {Object} ball
 * @param {Object} obj 
 * @returns {boolean}
 */
function rightCollision(ball, obj) {
    return (
        ball.x > (obj.x + obj.width) &&
        ball.y >= obj.y &&
        ball.y <= (obj.y + obj.height) &&
        (ball.x - ball.r) <= (obj.x + obj.width)
    )
}



/**
 * Functions checks if ball will collide on the bottom side of the object, 
 * functions checks collision by check the position of the ball relative
 * to the object and checks if the x and y values of the ball and object
 * intercept and returns a boolean based on the if the collions detected. 
 * 
 * @param {Object} ball
 * @param {Object} obj 
 * @returns {boolean}
 */
function bottomCollision(ball, obj) {
    return (
        ball.y > (obj.y + obj.height) &&
        ball.x >= obj.x &&
        ball.x <= (obj.x + obj.width) && 
        (ball.y - ball.r) <= (obj.y + obj.height)
    )
}



/**---------------------------------------------------------------------------------------------------------------------------------------------------
 * @code all the code for player paddle controls below
 *----------------------------------------------------------------------------------------------------------------------------------------------------
 */

// ket states for button typw input
let keyState = {"ArrowLeft": false,
                "ArrowRight": false};



/**
 * Functions looks for a key press and toggles the key state
 * 
 * @param {Event} e 
 */
function movePlayerKeys(e) {
    
    if (e.code == "ArrowLeft") {
        keyState["ArrowRight"] = false;
        keyState[e.code] = true;
    }
    else if (e.code == "ArrowRight") {
        keyState["ArrowLeft"] = false;
        keyState[e.code] = true;
    }
}

/**
 * Functions looks for a key up and toggles the keystat to false stoping the player paddle from moving
 * 
 * @param {Event} e 
 */
function stopPlayerKeys(e) {
    
    if (e.code == "ArrowLeft") {
        keyState[e.code] = false;
    }
    else if (e.code == "ArrowRight") {
        keyState[e.code] = false;
    }
}


/**
 * Function runs on the content of the page bieng loaded and assigns the key binds accordingly
 */
document.addEventListener("DOMContentLoaded", function () {


    let leftButton = document.getElementById("moveLeftButton");
    let rightButton = document.getElementById("moveRightButton");


    leftButton.onpointerdown = function() {
        keyState["ArrowRight"] = false;
        keyState["ArrowLeft"] = true;
    }
    leftButton.onpointerup = function() {
        keyState["ArrowLeft"] = false;
    }
    leftButton.pointerleave = function() {
        keyState["ArrowLeft"] = false;
    }

    rightButton.onpointerdown = function() {
        keyState["ArrowLeft"] = false;
        keyState["ArrowRight"] = true;
    }
    rightButton.onpointerup = function() {
        keyState["ArrowRight"] = false;
    }
    rightButton.pointerleave = function() {
        keyState["ArrowRight"] = false;
    }

    document.addEventListener("keydown", movePlayerKeys);

    document.addEventListener("keyup", stopPlayerKeys);

});



/**---------------------------------------------------------------------------------------------------------------------------------------------------
 * @code all code for the settings group below
 * ---------------------------------------------------------------------------------------------------------------------------------------------------
 */


// System settings
let system = {
    "pause" : true,
    "godMode" : false,
    "useSlider" : false
}



/**
 * 
 * Function toggles the input type between slider and buttons and styles the page accordingly
 * 
 * @param {String} id 
 * @param {String} setting 
 * @param {String} textOff 
 * @param {String} textOn 
 */
function toggleInputType(id, setting, textOff, textOn) {
    toggleSetting(id, setting, textOff, textOn);

    if (system["useSlider"]) {
        document.getElementById("controlButtonsGroup").style.display = "none";

        document.getElementById("sliderInput").value = paddle.x;

        document.getElementById("controlSliderGroup").style.display = "initial";
    }
    else {
        document.getElementById("controlButtonsGroup").style.display = "initial";

        document.getElementById("controlSliderGroup").style.display = "none";
    }
}

/**
 * 
 * Function toggles the setting passed as a paramater and styles the button accordingly
 * 
 * @param {String} id 
 * @param {String} setting 
 * @param {String} textOff 
 * @param {String} textOn 
 */
function toggleSetting(id, setting, textOff, textOn) {
    toggleButton = document.getElementById(id);

    if (system[setting]) {
        toggleButton.innerText = textOff;
        toggleButton.style.backgroundColor = "grey";
        
        system[setting] = false;
    }
    else {
        toggleButton.innerText = textOn;
        toggleButton.style.backgroundColor = "black";

        system[setting] = true;
    }
}


/**
 * Functions pasues and resumes the game, using pasuseGame function call and also toggles the
 * the pause status of the game using toggleSetting function call.
 * 
 * @param {String} id 
 * @param {String} setting 
 * @param {String} textOff 
 * @param {String} textOn 
 */
function pauseGameAndUpdate(id, setting, textOff, textOn) {
    toggleSetting(id, setting, textOff, textOn);

    pauseGame();
}


/**
 * Function takes string id of a selections element, and 3 input element ids for each R, G, and B 
 * and assigns those RGB values to the choose element.
 * 
 * @param {String} choiceID 
 * @param {String} idR 
 * @param {String} idG 
 * @param {String} idB 
 */
function changeColor(choiceID, idR, idG, idB){
    let choice = document.getElementById(choiceID).value;

    let rValue = 0;
    let gValue = 0;
    let bValue = 0;

    let idRVal = document.getElementById(idR).value;
    let idGVal = document.getElementById(idG).value;
    let idBVal = document.getElementById(idB).value;

    if (idRVal != null && idRVal != "" && verifyValue(parseInt(idRVal), 0, 255)) {
        rValue = parseInt(idRVal)
    } 
    if (idGVal != null && idGVal != "" && verifyValue(parseInt(idGVal), 0, 255)) {
        gValue = parseInt(idGVal)
    } 
    if (idBVal != null && idBVal != "" && verifyValue(parseInt(idBVal), 0, 255)) {
        bValue = parseInt(idBVal)
    } 

    let colorVal = "rgb("+rValue+","+gValue+","+bValue+")";

    if (choice == "paddle"){
        paddle.color = colorVal;
        document.getElementById(paddle.id).setAttribute("fill", paddle.color);
    }
    else if (choice == "ball") {
        ball.color = colorVal;
        document.getElementById(ball.id).setAttribute("fill", ball.color);
    }
    else if (choice == "bricks") {
        brickStat.color = colorVal;
        for (let b of bricks) {
            b.color = colorVal;
            document.getElementById(b.id).setAttribute("fill", b.color);
        }
    }
    
}
