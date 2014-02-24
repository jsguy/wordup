//  
//  WordUp 0.0.0.0.0.0.1
//
//	Requires: phaser, knockout, lodash
//
var game = new Phaser.Game(
	//	Arbritrary size - TODO: work out how to scale this for the native resolution
	640, 960, 
	Phaser.AUTO, 
	'wordup', {
		preload: preload, 
		create: create,
		update: update
	});

var tileX = 64, tileY = 64,
	//	Load game service
	service = gameservice({
		tileX: tileX,
		tileY: tileY
	}),
	levels;

//	Load resources
function preload() {
	game.load.image('grid', 'phaser/examples/assets/tests/debug-grid-1920x1920.png');
	game.load.image('atari1', 'phaser/examples/assets/sprites/atari130xe.png');
	game.load.image('atari2', 'phaser/examples/assets/sprites/atari800xl.png');
	game.load.atlas('letters', 'resources/letter_tiles.png', 'resources/letter_tiles.json');

	//  Show the whole thing http://www.html5gamedevs.com/topic/1380-how-to-scale-entire-game-up/
	//	TODO: Check with Dave if this works in app mode.
	game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL; //resize your window to see the stage resize too
	game.stage.scale.setShowAll();
	game.stage.scale.refresh();

	//	Load levels JSON
	//	http://www.html5gamedevs.com/topic/1936-import-files-and-data-json-parser/
	game.load.text('levels', 'levels.json');
};

function create() {
	//  Setup grid
	game.add.sprite(0, 0, 'grid');

	//	Cache loaded levels
	var levels = game.cache._text['levels'] = JSON.parse(game.cache.getText('levels'));

	//	Setup our fisrt level for now
	service.initMatrix(levels[0].initialMatrix);
};

function update() {
	//	process service updates
	service.update();
};