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
	game.load.atlas(
		'letters', 
		'resources/letter_tiles.png', 
		'resources/letter_tiles.json'
	);

	//  Show all http://www.html5gamedevs.com/topic/1380-how-to-scale-entire-game-up/
	game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL; //resize your window to see the stage resize too
	game.stage.scale.setShowAll();
	game.stage.scale.refresh();

	//	Load levels
	//	http://www.html5gamedevs.com/topic/1936-import-files-and-data-json-parser/
	game.load.text('levels', 'levels.json');

};

function create() {
	//  Setup grid
	game.add.sprite(0, 0, 'grid');

	//  Add some words for testing
	service.createWord("testing", 1, 4);
	service.createWord("wordup", 1, 4);

	//	Cache loaded levels
	game.cache._text['levels'] = JSON.parse(game.cache.getText('levels'));
	//var levels = game.cache.getText('levels');
	//game.cache._text['levels'] = JSON.parse(game.cache.getText('levels'));
	//console.log('lvs', JSON.parse(game.cache.getText('levels')));
//	console.log('levels', levels);
};