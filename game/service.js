//  
//  WordUp 0.0.0.0.0.0.1
//
//	word service - operations on words and the matrix
//
//	Requires: phaser, knockout, lodash
//

//	Basic closure for settngs options in the service
var gameservice = function(args){

	//	Set defaults
	args = _.assign({
		tileX: 64,
		tileY: 64,
		//	How big is it
		matrixSize: [10, 10],
		matrix: [],
		//
		//	Score per letter
		//	Intersecting = x2
		//	Intersecting at end of word = x 3
		//	
		scoreTable: {a: 1, b: 2, c: 2, d: 2, e: 1, f: 3, g: 2, h: 2, i: 1, j: 3, k: 3, l: 3, m: 2, n: 2, o: 1, p: 2, q: 4, r: 1, s: 1, t: 1, u: 2, v: 3, w: 2, x: 4, y: 3, z: 5 },
	}, args || {});

	console.log(args);

	//  Creates a word and adds it into the 
	var createWord = function(word, x, y) {
		if(!word) {
			return;
		}

		var offsetX = x? x * args.tileX: 0,
			offsetY = y? y * args.tileY: 0,
			//  Create and add a word group
			myWord = game.add.group();

		word = word.toLowerCase();

		//  Create all letters
		for(var i = 0; i < word.length; i += 1) {
			myWord.create(
				offsetX + i * args.tileX, 
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
		myWordSprite.width = args.tileX * word.length;
		myWordSprite.height = args.tileY;

		//  Enable dragging
		myWordSprite.inputEnabled = true;
		myWordSprite.input.useHandCursor = true;
		myWordSprite.input.enableDrag();

		//  Snap only when released, not on drag.
		myWordSprite.input.enableSnap(args.tileX, args.tileY, false, true);

		//	Check if this is the first time we're dragging
		//	as we need to add an offset on the first drag
		myWordSprite.hasDragged = false;

		//  When you start dragging the sprite
		myWordSprite.events.onInputDown.add(function(){
			clearInterval(myWordSprite.updateTime);
			//	Add an offset on the first drag
			if(!myWordSprite.hasDragged) {
				myWordSprite.origX = myWordSprite.x;
				myWordSprite.origY = myWordSprite.y;
				myWordSprite.hasDragged = true;
			}
			//	Use a timer to update the topsition of the word
			//	TODO: we need a way to call this in the 
			//	game update method instead of pur own timer.
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
	},

	renderMatrix = function() {

	};

	return {
		createWord: createWord
	};

};