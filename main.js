// Object destructuring to avoid writing
// new five.(...) every time.
const {Board, LCD, Button} = require('johnny-five');
const wait = require('wait-for-stuff');

const board = new Board({port: 'COM3'});

/*

Globals
———————
screen - represents the LCD.
player - the co-ordinates of the player character.
cursor - the co-ordinates of the cursor (more general than player).
obstacleChars - characters for the obstacles which will be picked from by the generateObstacle function.

*/
 
var screen;
const player = [1,0], cursor = [1,15];
const obstacleChars = ['duck', 'pointerleft', 'bigpointerleft'];

board.on('ready', () => {
    
    let is_setup = false;
    
    try {
        // Dynamically instantiate buttons.
        const buttons = {
            jump:  new Button({ pin: 5, isPullup: true})
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
        
        // Let the program know
        // that all's well.
        is_setup = true;
        
    } catch(e){
        console.log('There was a problem getting set up:', e);
    }
    
    if(!is_setup){
        return console.log("Can't continue without being set up properly. Exiting.");
    }
    
    // Set the player characters.
    screen.useChar('runninga'); // Jump
    screen.useChar('runningb'); // Idle
    
    // Set the obstacle characters.
    screen.useChar('duck');
    screen.useChar('pointerleft');
    screen.useChar('bigpointerleft');
    
    // Initially wipe the screen,
    // then draw the player.
    screen.clear().cursor(1,0).print(':runningb:').cursor(1,0);
    
    /*
    
    Game Variables
    ——————————————
    died - if the player has hit an obstacle.
    obstacles - the obstacles currently on the screen.
    
    */
    let died = false;
    const obstacles = [];
    
    // Game loop.
    while(!died){
        
        // If there are no obstacles, generate one.
        // Likewise if the cursor has reached the edge of the screen.
        if(!obstacles.length || !cursor[1]){
            obstacles.push(generateObstacle());
        }
        // Otherwise, inch the obstacle ever closer.
        else {
            moveObstacle(obstacles);
        }
        
        // Slow the refreshes down--effectively sets a refresh rate.
        wait.for.time(1);
    }
});

function moveObstacle(obstacles){
    
    // Obstacles is an array of the obstacles currently on screen,
    // and as such, we should iterate through each obstacle.
    for(let i = 0; i < obstacles.length; ++i){
        
        // If the obstacle has met the edge of the screen,
        // remove it from the list, effectively deleting it.
        if(!obstacles[i].coords[1]){
            obstacles.slice(i,1);
            continue;
        }
        
        let coords = [...obstacles[i].coords];
        screen.cursor(...coords).print(`:${obstacles[i].char}:`);
        
        obstacles[i].coords[1]--;
        
        screen.cursor(...[coords[0], coords[1]-1]).print(' ');
    }
}

function generateObstacle(){
    let r = Math.floor(Math.random() * obstacleChars.length);
    
    screen.cursor(...cursor).print(`:${obstacleChars[r]}:`).cursor(...cursor);
    
    return {
        coords: [...cursor], // avoid creating an object (or array) reference.
        char: obstacleChars[r]
    }
}

// Helper function.
function draw(string, point){
    if(!typeof(string) === "String"){
        throw new Error("That's not a string, budster.");
    }
    return screen.print(string).cursor(...point);
}

// Define the player jump action.
function jump(){
    --player[0];
    screen.clear();
    screen.cursor(...player).print(':runninga:').cursor(...player);
    
    wait.for.time(1);
    
    ++player[0];
    screen.clear();
    screen.cursor(...player).print(':runningb:').cursor(...player);
}

// Store event handlers (a.k.a. game actions, or simply actions).
const actions = { jump }