// Object destructuring to avoid writing
// new five.(...) every time.
const {Board, LCD, Button} = require('johnny-five');
const wait = require('wait-for-stuff');

const board = new Board({port: 'COM3'});

/*

Globals
———————
screen - represents the LCD.
died   - global flag for the game loop. When true, game is over.
player - the co-ordinates of the player character.
obstacleChars - characters for the obstacles which will be picked from by the generateObstacle function.

*/

// Global components
var screen, buttons;

global.died = false;

var isJumping = false;
const player = [1,3];
const obstacleChars = ['duck', 'pointerleft', 'bigpointerleft'];

board.on('ready', () => {
    
    let is_setup = false;

    try {
        // Dynamically instantiate buttons.
        buttons = {
            jump:    new Button({ pin: 5, isPullup: true}),
            restart: new Button({ pin: 4, isPullup: true}),
        }

        // Dynamically assigns event handlers.
        for(let btn in buttons){
            // btn is the name of the button (e.g., 'jump').
            // buttons[btn] grabs the actual button object.
            
            // actions[btn] will assign the action function
            // corresponding with the button's name.
            buttons[btn].on('press', actions[btn]);
        }
        
        screen = new LCD({
            pins: [7, 8, 9, 10, 11, 12],
            backlight: 6,
            rows: 2,
            cols: 16
        });
        
        // Set the player characters.
        screen.useChar('runninga'); // Jump
        screen.useChar('runningb'); // Idle
        
        // Set the obstacle characters.
        screen.useChar('duck');
        screen.useChar('pointerleft');
        screen.useChar('bigpointerleft');

        // Let the program know
        // that all's well.
        is_setup = true;
    } catch(e){
        console.log('There was a problem getting set up:', e);
    }

    if(!is_setup){
        return console.log("Can't continue without being set up properly. Exiting.");
    }
    
    // Begin a game.
    game();
});

function moveObstacle(obstacles){
    
    // Obstacles is an array of the obstacles currently on screen,
    // and as such, we should iterate through each obstacle.
    for(let i = 0; i < obstacles.length; ++i){
        
        // Check if this obstacle has hit the player.
        if(obstacles[i].coords.join('') === player.join('')){
            died = true;
            break;
        }
        
        // Clear the previous position.
        screen.cursor(...obstacles[i].coords).print(' ');
        
        // If the obstacle has met the edge of the screen,
        // remove it from the list, effectively deleting it.
        if(!obstacles[i].coords[1]){
            obstacles.splice(i,1);
            continue;
        }
        
        obstacles[i].coords[1] -= 1;
        screen.cursor(...obstacles[i].coords).print(`:${obstacles[i].char}:`);
    }
}

function generateObstacle(){
    let r = Math.floor(Math.random() * obstacleChars.length);
    
    screen.cursor(1,15).print(`:${obstacleChars[r]}:`);
    
    return {
        coords: [1,15],
        char: obstacleChars[r]
    }
}

// Define the player jump action.
function jump(){
    if(!died){
        isJumping = true;
        
        screen.cursor(...player).print(' ');
        
        player[0] = 0;
        screen.cursor(...player).print(':runninga:');
        
        setTimeout(() => {
            screen.cursor(...player).print(' ');
            
            player[0] = 1;
            screen.cursor(...player).print(':runningb:');
            
            isJumping = false;
        }, 1000);
    }
    
}

function restart(){
    if(died){
        died = false;
        game();
    }
}

// Store event handlers (a.k.a. game actions, or simply actions).
const actions = { jump, restart }

function game(){
    
    // Initially wipe the screen,
    // then draw the player.
    screen.clear().cursor(...player).print(':runningb:');
    
    /*
    
    Game Variables
    ——————————————
    died - if the player has hit an obstacle.
    obstacles - the obstacles currently on the screen.
    
    */
    const obstacles = [];
    
    // Game loop.
    while(!died){
        
        // If there are no obstacles, generate one.
        // Likewise if the cursor has reached the edge of the screen.
        if(!obstacles.length){
            obstacles.push(generateObstacle());
        }
        
        // Otherwise, inch the obstacle ever closer.
        else {
            moveObstacle(obstacles);
        }
        
        // Slow the refreshes down--effectively sets a refresh rate.
        wait.for.time(.25);
    }
    
    screen.clear();
    gameOver();
}

function gameOver(){
    screen.clear().home().print('Game Over');
    
    wait.for.time(1);
    
    screen.clear().home().print('Click the button');
    screen.cursor(1,0).print('to play again.');
}