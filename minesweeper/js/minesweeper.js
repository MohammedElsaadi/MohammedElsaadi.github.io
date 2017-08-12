var time; //holds the interval for the window to update time, needed as a variable so I can clear that interval in a new game
var noClicks = true; //the boolean that controls the FIRST click of the game
var numRevealed = 0; //the number of tiles revealed
var gridX;
var gridY; //setting for easy by default
var numMines;// = 10; //setting for easy difficulty mines
var numFlags = 0; //holds the number of flags used
var mineFlaggedCorrect = 0; //this holds number for the mines correctly flagged, doesnt increase if you flag a non-mine
var mineHit = false; //when it is true it means you hit a mine and lost
var winner = false; //when it is true it means you won
var minesArray = []; //holds the mines
var usedCoords = []; //holds the coordinates used by: the first click, the 8 adjacent spots (that cantbe mines), and the mines to prevent overlap


function startGame() {
	//resets the variables to default setting
	minesArray = [];
	usedCoords = [];
	noClicks = true;
	numFlags = 0;
	numRevealed = 0;
	numMineFlaggedCorrect = 0;
	
	//resets wincondition values
	winner = false; 
	mineHit = false;
	
	
	
	clearInterval(time); //now the interval is cleared so that everytime a new game is started it doesnt 'stack up' the intervals and speed up the progression of time
	setDifficulty(); //check difficulty before starting the game
	buildGrid(); //resets minefield innerHTML and recreates grid
    startTimer(); //resets the timer/player score to 0
	
	//reset smileyface classList and set the remaining mines correctly
	var remainingMines = document.getElementById("flagCount");
	remainingMines.innerHTML = numMines - numFlags;
    var smiley = document.getElementById("smiley");
	//smiley.classList.add("face_up");
	smiley.classList.remove("face_lose");
	smiley.classList.remove("face_win");
}

function setDifficulty() {
	//this function reads the index of the dropdown list and sets the game variables accordingly to the difficulty
    var difficultySelector = document.getElementById("difficulty");
    var difficulty = difficultySelector.selectedIndex;
	
	switch (difficulty){
		case 0:
			gridX = gridY = 9;
			numMines = 10;
			break;
		case 1:
			gridX = gridY = 16;
			numMines = 40;
			break;
		case 2:
			gridX = 30;
			gridY = 16;
			numMines = 99;
			break;
	}
}

function setMines(x,y){
//this function generates the mines and places them only in unused coordinates
//the parameters x and y represent the coordinates of the first click
	var yarr = []; //Whenever an x value is generated, we check the used coordinates array
						//everytime we find the x value in used coordinates, we add it's y value to this array
	var n1, n2; //holds generated numbers
	
	for (var i = 0; i < numMines; i++){ //loops once for every mine we need
		//adding an object to each index of the array with an X value and a Y value
		n1 = Math.floor(Math.random() * gridX);
		n2 = Math.floor(Math.random() * gridY);
		while (n1 == x && n2 == y){ //so long as the new values dont match the first click, generate new values
			n1 = Math.floor(Math.random() * gridX);
			n2 = Math.floor(Math.random() * gridY);
		}//this seems redundant considering the next part but for some reason it wasnt working only for the very first click's coordinates
		
		//now go through used coordinates array and evertime the new x value is found as used, store it's y pair value in yarr
		for (var j = 0; j < usedCoords.length; j++){ 
			if (usedCoords[j].x == n1){ //so everytime we find an x value, we will add the corresponding y value to yarr
				yarr.push(parseInt(usedCoords[j].y)); //stores y value in y array
			}			
		}
		while (yarr.indexOf(parseInt(n2)) >= 0){ //as long as the new Y is already inside of yarr, generate a new number
			n2 = Math.floor(Math.random() * gridY);
		}	
		//now that we have an unused coordinate, push them into arrays
		minesArray.push({x:n1,y:n2});
		usedCoords.push({x:n1,y:n2});
		yarr = []; //reset yarr
	}
}

function buildGrid() {
    // Fetch grid and clear out old elements.

    var grid = document.getElementById("minefield");
    grid.innerHTML = "";

    var columns = gridX;
    var rows = gridY;

    // Build DOM Grid
    var tile;
    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < columns; x++) {
            tile = createTile(x,y);
            grid.appendChild(tile);
        }
    }
    
    var style = window.getComputedStyle(tile);

	//this slices off the letters px when getting the current sizes
    var width = parseInt(style.width.slice(0, -2));
    var height = parseInt(style.height.slice(0, -2));
    
	//now set new size
    grid.style.width = (columns * width) + "px";
    grid.style.height = (rows * height) + "px";
}

//this function creates the tiles
function createTile(x,y) {
	//set tile as a div
    var tile = document.createElement("div");
	
	//add to the classList that it is a hidden tile, unflagged attribute as well as give it x and y value
    tile.classList.add("tile");	
    tile.classList.add("hidden");
	tile.setAttribute('xpos',x);
	tile.setAttribute('ypos',y);
	tile.setAttribute('unflagged','');

	
    tile.addEventListener("auxclick", function(e) { e.preventDefault(); }); // Middle Click
    tile.addEventListener("contextmenu", function(e) { e.preventDefault(); }); // Right Click
    tile.addEventListener("mouseup", handleTileClick ); // All Clicks
	tile.addEventListener("mousedown", smileyLimbo ); //limbo while mouse is down over tiles

    return tile;
}

function assignTiles(){
//this function assigns the tiles as a mine, a clear spot, or a hint
	var grid = document.getElementById("minefield");
	var gridTiles = grid.children;
	
	//if the current tile's coords match the coords of a mine, it is a mine
	for (var i = 0; i < gridTiles.length; i++){
		for (var j = 0; j < numMines; j++){ //set the tiles to mines if they are in the same spot as the mines in minesArray
			if (gridTiles[i].getAttribute('xpos') == minesArray[j].x && gridTiles[i].getAttribute('ypos') == minesArray[j].y){
				gridTiles[i].setAttribute('mine','');
			}
		}
		//now if tile isnt mine, set it's hint number based on it's adjacent tiles
		//if no mine is adjacent, it is clear
		if (!gridTiles[i].hasAttribute('mine')){ 
			mineCount =	setHint(gridTiles[i].getAttribute('xpos'),gridTiles[i].getAttribute('ypos')); //calls function that checks adjacent locations and counts each time an occurance takes place
			if (mineCount === 0){
				gridTiles[i].setAttribute('clear','');
			}else{
				gridTiles[i].setAttribute('hint',mineCount);
			}
		}
	}
}


function setHint(x,y){
//this function is used when a gridTile in assignTiles is found to be a hint, it counts everytime an adjacent tile is a mine and uses that value to set it's hint
	var count = 0;
	for (var i = 0; i < numMines; i++){
		if ( //checks if there is an adjacent mine by comparing current x and y to the coordinates of the mines
		minesArray[i].x == parseInt(x)-1 && minesArray[i].y == parseInt(y)-1 ||	//adjacent topleft
		minesArray[i].x == parseInt(x)-1 && minesArray[i].y == y ||		//adjacent left
		minesArray[i].x == parseInt(x)-1 && minesArray[i].y == parseInt(y)+1 ||	//adjacent bottomleft
		minesArray[i].x == x && minesArray[i].y == parseInt(y)-1 ||		//adjacent top
		minesArray[i].x == x && minesArray[i].y == parseInt(y)+1 ||	//adjacent bottom
		minesArray[i].x == parseInt(x)+1 && minesArray[i].y == parseInt(y)-1 ||	//adjacent bottomright
		minesArray[i].x == parseInt(x)+1 && minesArray[i].y == y ||	//adjacent right
		minesArray[i].x == parseInt(x)+1 && minesArray[i].y == parseInt(y)+1 	//adjacent topright
		){
			//once found in anycase around the tile, increment count and continue through list of mines
			count++;
		}
	
	}
	return count; //send back value to be the hint value
}

function revealAllAdjacent(x,y,middle){
//this function reveals all adjacent tiles, the x and y parameters is the coords of the middle tile, and the middle parameter is a boolean
//if this function is called from clicking the middlemouse button, middle is true
//otherwise it is false (for when you left click a clear tile, which auto reveals adjacent tiles

	var grid = document.getElementById("minefield");
	var gridTiles = grid.children;
	
	for (var i = 0;i < gridTiles.length; i++){
		if ( //first check if current gridTile is an adjacent one to the clicked location, had to use parseInt function because it kept concatenating the additions into strings rather than doing the math
		gridTiles[i].getAttribute('xpos') == parseInt(x)-1 && gridTiles[i].getAttribute('ypos') == parseInt(y)-1 ||
		gridTiles[i].getAttribute('xpos') == parseInt(x)-1 && gridTiles[i].getAttribute('ypos') == y ||
		gridTiles[i].getAttribute('xpos') == parseInt(x)-1 && gridTiles[i].getAttribute('ypos') == parseInt(y)+1 ||
		gridTiles[i].getAttribute('xpos') == x && gridTiles[i].getAttribute('ypos') == parseInt(y)-1 ||
		gridTiles[i].getAttribute('xpos') == x && gridTiles[i].getAttribute('ypos') == parseInt(y)+1 ||
		gridTiles[i].getAttribute('xpos') == parseInt(x)+1 && gridTiles[i].getAttribute('ypos') == parseInt(y)-1 ||
		gridTiles[i].getAttribute('xpos') == parseInt(x)+1 && gridTiles[i].getAttribute('ypos') == y ||
		gridTiles[i].getAttribute('xpos') == parseInt(x)+1 && gridTiles[i].getAttribute('ypos') == parseInt(y)+1
		){
			//if adjacent is already revealed, no need to follow through
			if (!gridTiles[i].hasAttribute('revealed')){
				//if it is, check if the adjacent one is clear or a hint, if its a mine or flagged it wont do anything because it wont check
				if (gridTiles[i].hasAttribute('flagged')){
					continue;
				}else if (gridTiles[i].hasAttribute('clear')){
					gridTiles[i].classList.remove("hidden");
					gridTiles[i].setAttribute('revealed','');
					numRevealed++;
					revealAllAdjacent(gridTiles[i].getAttribute('xpos'),gridTiles[i].getAttribute('ypos'),false);
				}else if (gridTiles[i].hasAttribute('hint')){
					gridTiles[i].classList.remove("hidden");
					gridTiles[i].classList.add( "tile_" + gridTiles[i].getAttribute('hint') );
					gridTiles[i].setAttribute('revealed','');
					numRevealed++;
				}else if (middle == true && gridTiles[i].hasAttribute('mine')){
					//it is important to note that if flags = hint but the mine isnt flagged then the mine will explode when attempting to middle click
					gridTiles[i].classList.remove("hidden");
					gridTiles[i].classList.add("mine_marked");
					gridTiles[i].setAttribute('revealed','');
					mineHit = true;
				}
			}
		}
	}
}

function revealMiddleClick(x,y,hint){
	//this function checks around the clicked tile to count the adjacent flags
	//because it only will attempt to reveal adjacent blocks if number of flagged is equal to the hint
	var grid = document.getElementById("minefield");
	var gridTiles = grid.children;
	var fCount = 0;
	for (var i = 0;i < gridTiles.length; i++){
		if (
		gridTiles[i].getAttribute('xpos') == parseInt(x)-1 && gridTiles[i].getAttribute('ypos') == parseInt(y)-1 ||
		gridTiles[i].getAttribute('xpos') == parseInt(x)-1 && gridTiles[i].getAttribute('ypos') == y ||
		gridTiles[i].getAttribute('xpos') == parseInt(x)-1 && gridTiles[i].getAttribute('ypos') == parseInt(y)+1 ||
		gridTiles[i].getAttribute('xpos') == x && gridTiles[i].getAttribute('ypos') == parseInt(y)-1 ||
		gridTiles[i].getAttribute('xpos') == x && gridTiles[i].getAttribute('ypos') == parseInt(y)+1 ||
		gridTiles[i].getAttribute('xpos') == parseInt(x)+1 && gridTiles[i].getAttribute('ypos') == parseInt(y)-1 ||
		gridTiles[i].getAttribute('xpos') == parseInt(x)+1 && gridTiles[i].getAttribute('ypos') == y ||
		gridTiles[i].getAttribute('xpos') == parseInt(x)+1 && gridTiles[i].getAttribute('ypos') == parseInt(y)+1
		){
			if (gridTiles[i].hasAttribute('flagged')){
				fCount++;
			}
		}
	}
	if (fCount == hint){
		revealAllAdjacent(x,y,true);
	}
}


function handleTileClick(event) {
	//function to handle clicks
	
	//once click is up -> no more limbo, clear smiley from anticipation
	smiley.classList.remove("face_limbo");
	
	//give access to the element so we can edit the innerHTML as mines are cleared
	var remainingMines = document.getElementById("flagCount");
	
    // Left Click

		//otherwise, if it isnt the first click...
		if (mineHit === false && winner === false){ //this if statement makes it so u cant click anymore after losing or winning
		
		//left clicks
		if (event.which === 1) {
				if (noClicks === true){
					this.classList.remove("hidden");
					numRevealed++;
					usedCoords.push( {x : this.getAttribute('xpos'), y : this.getAttribute('ypos') }); //the coord of the click
		/*usedCoords.push( {x : parseInt(this.getAttribute('xpos')) - 1, y : parseInt(this.getAttribute('ypos')) - 1 }); //the top right
		usedCoords.push( {x : parseInt(this.getAttribute('xpos')) - 1, y : this.getAttribute('ypos') }); // the right sidebar
		usedCoords.push( {x : parseInt(this.getAttribute('xpos')) - 1, y : parseInt(this.getAttribute('ypos')) + 1 }); //the bottom right
		usedCoords.push( {x : this.getAttribute('xpos'), y : parseInt(this.getAttribute('ypos')) - 1 }); //the top
		usedCoords.push( {x : this.getAttribute('xpos'), y : parseInt(this.getAttribute('ypos')) + 1}); //the bottom
		usedCoords.push( {x : parseInt(this.getAttribute('xpos')) + 1, y : parseInt(this.getAttribute('ypos')) - 1 }); //the top left
		usedCoords.push( {x : parseInt(this.getAttribute('xpos')) + 1, y : this.getAttribute('ypos') }); //the left
		usedCoords.push( {x : parseInt(this.getAttribute('xpos')) + 1, y : parseInt(this.getAttribute('ypos')) + 1 }); //the bottom left*/
		noClicks = false;
		//now that the first click is done, assign the tiles and mines around it and the adjacent tiles
		setMines(this.getAttribute('xpos'),this.getAttribute('ypos'));
		assignTiles();
		if (this.hasAttribute('clear')){
			revealAllAdjacent(this.getAttribute('xpos'),this.getAttribute('ypos'),false);
		}
		//this.setAttribute('revealed','');
	}
			if (!this.hasAttribute('revealed') && this.hasAttribute('unflagged')){ //if it isnt revelead and it isnt flagged...
				if (this.hasAttribute('mine')){ //if u hit a mine, u lose
					this.classList.add("mine_hit");
					mineHit = true;
				}else if (this.hasAttribute('clear')){ //if it is clear, it will reveal adjacent spots
					revealAllAdjacent(this.getAttribute('xpos'),this.getAttribute('ypos'),false);
					numRevealed++;
				}else{
					this.classList.add("tile_" + this.getAttribute('hint')); //otherwise it hit a hint, uses value from hint to get correct class
					numRevealed++;
				}
				 //no matter the case, mark the revealed tile as revealed instead of hidden
				this.classList.remove("hidden");
				this.setAttribute('revealed','');
			}
		}
		
		
		// Middle Click
		else if (event.which === 2) {
			if (this.hasAttribute('revealed') && this.hasAttribute('hint')){
				//sends to revealmiddle function the coordinates as well as the hint value
				revealMiddleClick(this.getAttribute('xpos'),this.getAttribute('ypos'),this.getAttribute('hint'));
			}
		}
		
		
		// Right Click
		else if (event.which === 3) {
			//if it has a flag and you rightclick, unflag it
			if (this.hasAttribute('flagged')){
				if (this.hasAttribute('mine')){
					//important to adjust the number of flagged mines if you deflag a mine
					numMineFlaggedCorrect--;
				}
				this.removeAttribute('flagged');
				this.setAttribute('unflagged','');
				this.classList.remove("flag");
				this.classList.add("hidden");
				numFlags--;
				//adjust the remaining mines
				remainingMines.innerHTML = numMines - numFlags;
				
				//otherwise, add the flag so long it isnt a revelead tile
			}else if (this.hasAttribute('unflagged') && !this.hasAttribute('revealed')){
				if (this.hasAttribute('mine')){
					//if it was a mine that was flagged, increased mine flagged counter
					numMineFlaggedCorrect++;
				}
				this.setAttribute('flagged','');
				this.removeAttribute('unflagged');
				this.classList.remove("hidden");
				this.classList.add("flag");
				numFlags++;
				//adjust remaining mines
				remainingMines.innerHTML = numMines - numFlags;
			}
		}
		
		}
	
		//so if u hit a mine, the game is over
		if (mineHit === true){
			gameOver();
		}
		//if at any point all the non-mines are revealed OR the mines are all flagged, the game is won
		if ( (numRevealed === ((gridX * gridY) - numMines)) || numMineFlaggedCorrect === numMines){
			winner = true;
			gameWin();
		}
}



// SMILEY FACE STUFF

function smileyLimbo(){
	if (winner === false && mineHit === false){
		var smiley = document.getElementById("smiley");
		smiley.classList.add("face_limbo");
	}
}
function smileyDown() {
    var smiley = document.getElementById("smiley");
    smiley.classList.add("face_down");
}

function smileyUp() {
    var smiley = document.getElementById("smiley");
    smiley.classList.remove("face_down");
}

//win/lose functions + smiley face stuff
function gameWin(){
	var smiley = document.getElementById("smiley");	
	smiley.classList.add("face_win");
	document.getElementById("minefield").innerHTML += "<p>WINNER! </p><p>Your score is: </p>" + document.getElementById("timer").innerHTML + "</p>";

}

function gameOver(){
	//function for game over
	var smiley = document.getElementById("smiley");
    smiley.classList.add("face_lose");
	document.getElementById("minefield").innerHTML += "You lose...<p>better luck next time!</p>";
}


function startTimer() {
	//function for timer
    timeValue = 0;
	//time holds reference for the interval so that it can be cleared once game finishes
	//otherwise the interval stacks and speeds up
    time = window.setInterval(onTimerTick, 1000);
}

function onTimerTick() {
    timeValue++;
	if (mineHit === false && winner === false){
		updateTimer();
	}
}

function updateTimer() {
    document.getElementById("timer").innerHTML = timeValue;
}