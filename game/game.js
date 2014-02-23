//  
//  WordUp 0.0.0.0.0.0.1
//
//	Requires: phaser, knockout, lodash
//

var game = new Phaser.Game(
	640, 960, 
	Phaser.AUTO, 
	'phaser-example', 
	{ 
		preload: preload, 
		create: create 
	});

var tileX = 64, tileY = 64,
	grid = [], getTile;

for(var i = 0; i < 10; i += 1) {
	grid[i] = [];
	for(var j = 0; j < 10; j += 1) {
		grid[i][j] = "";
	}
}

getTile = function(x, y){
	return grid[x][y];
};

function preload() {

	game.load.image('grid', 'phaser/examples/assets/tests/debug-grid-1920x1920.png');
	game.load.image('atari1', 'phaser/examples/assets/sprites/atari130xe.png');
	game.load.image('atari2', 'phaser/examples/assets/sprites/atari800xl.png');

	game.load.atlas(
		'letters', 
		'resources/letter_tiles.png', 
		'resources/letter_tiles.json'
	);

	//  Show all http://www.html5gamedevs.com/topic/1380-how-to-scale-entire-game-up/
	game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL; //resize your window to see the stage resize too
	game.stage.scale.setShowAll();
	game.stage.scale.refresh();
}

//  Custom function to create a word
var createWord = function(word, x, y) {
	if(!word) {
		return;
	}

	var offsetX = x? x * tileX: 0,
		offsetY = y? y * tileY: 0;

	//  Create and add a word group
	var myWord = game.add.group();

	word = word.toLowerCase();

	//  Create all letters
	for(var i = 0; i < word.length; i += 1) {
		myWord.create(
			offsetX + i * tileX, 
			offsetY, 
			'letters', 
			word.charAt(i) + '.png'
		);
	}

	//  You cannot drag a group: 
	//  http://www.html5gamedevs.com/topic/2336-input-andor-drag-on-a-group/
	//  So we create a sprite that overlays the word, and 
	//  track it uising sprite.events.onInputDown
	var myWordSprite = game.add.sprite(offsetX, offsetY);
	myWordSprite.width = tileX * word.length;
	myWordSprite.height = tileY;

	//  Enable dragging
	myWordSprite.inputEnabled = true;
	myWordSprite.input.useHandCursor = true;
	myWordSprite.input.enableDrag();

	//  Snap only when released, not on drag.
	myWordSprite.input.enableSnap(tileX, tileY, false, true);

	myWordSprite.hasDragged = false;

	//  When you start dragging the sprite
	myWordSprite.events.onInputDown.add(function(){
		clearInterval(myWordSprite.updateTime);
		if(!myWordSprite.hasDragged) {
			myWordSprite.origX = myWordSprite.x;
			myWordSprite.origY = myWordSprite.y;
			myWordSprite.hasDragged = true;
		}
		myWordSprite.updateTime = setInterval(function(){
			myWord.x = myWordSprite.x - myWordSprite.origX;
			myWord.y = myWordSprite.y - myWordSprite.origY;
		}, 13);
	});

	myWordSprite.events.onInputUp.add(function(){
		clearInterval(myWordSprite.updateTime);
		myWord.x = myWordSprite.x - myWordSprite.origX;
		myWord.y = myWordSprite.y - myWordSprite.origY;
	});
};


function create() {
	//  Setup grid
	game.add.sprite(0, 0, 'grid');

	//  Add some words
	createWord("testing", 1, 4);
	createWord("wordup", 1, 4);
};