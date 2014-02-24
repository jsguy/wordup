//  
//  WordUp 0.0.0.0.0.0.1
//
//	word service - operations on words and the matrix
//
//	Requires: phaser, knockout, lodash
//

//	Basic closure for settngs options in the game service
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
	}, args || {}),
	//	Queue for functions to run in the update loop
	//	CAUTION: these need to be optimal, as they are run each frame
	updateQueue = [],
	//	Binds a function to be run in the update
	//	Returns: index so you can unbined using it
	bind = function(func) {
		updateQueue.push(func);
		return updateQueue.length - 1;
	},
	unbind = function(index) {
		if(typeof index !== 'undefined') {
			updateQueue.splice(index, 1);
		}
	};

	console.log(args);

	//  Creates a word and adds it into the 
	var createWord = function(word, x, y, vert) {
		if(!word) {
			return;
		}

		if(vert) {
			var tmpX = x;
			x = y;
			y = tmpX;
		}

		var offsetX = x? x * args.tileX: 0,
			offsetY = y? y * args.tileY: 0,
			//  Create and add a word group
			myWord = game.add.group();

		word = word.toLowerCase();

		//  Create all letters
		for(var i = 0; i < word.length; i += 1) {
			myWord.create(
				// offsetX + i * args.tileX, 
				// offsetY, 
				offsetX + (vert? 0: i * args.tileX), 
				offsetY + (vert? i * args.tileY: 0), 
				'letters', 
				word.charAt(i) + '.png'
			);
		}

		//  You cannot drag a group: 
		//  http://www.html5gamedevs.com/topic/2336-input-andor-drag-on-a-group/
		//  So we create a sprite that overlays the word, and 
		//  track it uising sprite.events.onInputDown
		var myWordSprite = game.add.sprite(offsetX, offsetY);
		myWordSprite.width = (vert)? args.tileX: args.tileX * word.length;
		myWordSprite.height = (vert)? args.tileY * word.length: args.tileY;

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
			//	Add an offset on the first drag
			if(!myWordSprite.hasDragged) {
				myWordSprite.origX = myWordSprite.x;
				myWordSprite.origY = myWordSprite.y;
				myWordSprite.hasDragged = true;
			}
			myWordSprite.spriteUpdate = bind(function(){

				myWord.x = myWordSprite.x - myWordSprite.origX;
				myWord.y = myWordSprite.y - myWordSprite.origY;
			});
		});

		//	When you're done dragging the sprite
		myWordSprite.events.onInputUp.add(function(){
			unbind(myWordSprite.spriteUpdate);
			myWordSprite.spriteUpdate = null;
			myWord.x = myWordSprite.x - myWordSprite.origX;
			myWord.y = myWordSprite.y - myWordSprite.origY;
			
			//	TODO: limit to within grid

		});
	},

	//	Initialises the matrix, with the optional placed words
	initMatrix = function(placedWords) {
		for(var y = 0; y < args.matrixSize[1]; y += 1) {
			args.matrix[y] = [];
			for(var x = 0; x < args.matrixSize[0]; x += 1) {
				args.matrix[y][x] = "";
			}
		}
		if(placedWords) {
			if(placedWords.length) {
				for(var i = 0; i < placedWords.length; i += 1) {
					var w = placedWords[i];
					//	Use the non-checked way to place the word
					placeWordInMatrix(w.word, w.x, w.y, w.vert);
				}
			}
		}
		return args.matrix;
	},


	//	Returns a vertical version of the matrix - makes checking words easier
	verticalMatrix = function(flipMatrix) {
		//	Create vertical matrix
		var vMatrix = [],
			myMatrix = (flipMatrix)? flipMatrix: args.matrix;
		for(var y = 0; y < args.matrixSize[1]; y += 1) {
			vMatrix[y] = vMatrix[y] || [];
			for(var x = 0; x < args.matrixSize[0]; x += 1) {
				vMatrix[y][x] = vMatrix[y][x] || [];
				vMatrix[y][x] = myMatrix[x][y];
			}
		}

		return vMatrix;
	},
	//	Renders the contents of the matrix into the DOM
	renderMatrix = function(vert, target) {
		var myMatrix = (vert)? verticalMatrix(): matrix;

		target = target || '#matrix';

		//	Create matrix html
		var matrixHtml = "";
		for(var y = 0; y < args.matrixSize[1]; y += 1) {
			for(var x = 0; x < args.matrixSize[0]; x += 1) {
				//	DOM
				matrixHtml += Mustache.compile(cellTmpl)({
					x: x,
					y: y,
					letter: myMatrix[x][y]? myMatrix[x][y]: ""
				});
			}
		}

		//	Inject into DOM
		$(target).html(matrixHtml);
	},


	//	Places a word in the matrix (without checking if it can be)
	placeWordInMatrix = function(word, x, y, vert) {
		var count = 0,
			myMatrix = args.matrix;

		x = parseInt(x, 10);
		y = parseInt(y, 10);

		if(vert) {
			myMatrix = verticalMatrix();
			var tmpX = parseInt(x, 10);
			x = parseInt(y, 10);
			y = parseInt(tmpX, 10);
		}

		for(var ix = x; ix < x + word.length; ix += 1) {
			myMatrix[ix][y] = word.charAt(count);
			count += 1;
		}

		//	Add onto game board
		// service.createWord("testing", 1, 4);
		// service.createWord("wordup", 1, 4);
		service.createWord(word, x, y, vert);

		args.matrix = (vert)? verticalMatrix(myMatrix): myMatrix;
	},

	//	This is run in the update loop
	update = function(){
		for(i = 0; i < updateQueue.length; i += 1) {
			updateQueue[i]();
		}
	};

	return {
		createWord: createWord,
		update: update,
		initMatrix: initMatrix
	};

};