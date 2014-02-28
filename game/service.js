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
		//	How big is the matrix (play field)
		matrixSize: [10, 10],
		placedWords: [],
		//
		//	Score per letter
		//	Intersecting = x2
		//	Intersecting at end of word = x 3
		//	
		scoreTable: {a: 1, b: 2, c: 2, d: 2, e: 1, f: 3, g: 2, h: 2, i: 1, j: 3, k: 3, l: 3, m: 2, n: 2, o: 1, p: 2, q: 4, r: 1, s: 1, t: 1, u: 2, v: 3, w: 2, x: 4, y: 3, z: 5 },
		initScore: 0
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
				
			myWordSprite.prevX = myWordSprite.x;
			myWordSprite.prevY = myWordSprite.y;

			myWordSprite.spriteUpdate = bind(function(){
				myWord.x = myWordSprite.x - myWordSprite.origX;
				myWord.y = myWordSprite.y - myWordSprite.origY;
			});
		});

		//	When you're done dragging the sprite
		myWordSprite.events.onInputUp.add(function(sprite, pointer, isOver){
			//	Not really sure why, but this is called twice, first 
			//	with isOver: true, and then always without isOver
			if(!isOver) {
				unbind(myWordSprite.spriteUpdate);
				myWordSprite.spriteUpdate = null;

				myWord.x = myWordSprite.x - myWordSprite.origX;
				myWord.y = myWordSprite.y - myWordSprite.origY;
				
				//	TODO: limit to within grid

				//	TODO: Ensure you can actually place the word here

				//	Move word in the matrix
				moveWordInMatrix(
					{ word: word, x: myWordSprite.prevX / args.tileX, y: myWordSprite.prevY / args.tileY, vert: vert },
					{ word: word, x: myWordSprite.x / args.tileX, y: myWordSprite.y / args.tileY, vert: vert }
				);

				//	TODO: Update score
				//console.log('scoreMatrix', service.scoreMatrix());
			}
		});
	},

	//	Initialises the words, with the optional placed words
	initWords = function(placedWords) {
		if(placedWords) {
			if(placedWords.length) {
				for(var i = 0; i < placedWords.length; i += 1) {
					var w = placedWords[i];
					//	Use the non-checked way to place the word
					placeWordInMatrix(w.word, w.x, w.y, w.vert);
				}
			}
		}
	},

	//	Returns a vertical version of the matrix
	//	This makes checking and placing vertical words easier
	verticalMatrix = function(myMatrix) {
		//	Create vertical matrix
		var vMatrix = [];
		for(var y = 0; y < args.matrixSize[1]; y += 1) {
			vMatrix[y] = vMatrix[y] || [];
			for(var x = 0; x < args.matrixSize[0]; x += 1) {
				vMatrix[y][x] = vMatrix[y][x] || [];
				vMatrix[y][x] = myMatrix[x][y];
			}
		}

		return vMatrix;
	},

	//	Places a new word in the matrix
	//	Note: this is done without checking if it can be placed
	placeWordInMatrix = function(word, x, y, vert) {
		var count = 0;

		x = parseInt(x, 10);
		y = parseInt(y, 10);

		//	Add to our placed words
		args.placedWords.push({
			word: word,
			x: x,
			y: y,
			vert: vert			
		});

		//	Handle vertical
		if(vert) {
			var tmpX = parseInt(x, 10);
			x = parseInt(y, 10);
			y = parseInt(tmpX, 10);
		}

		//	Add onto phaser game board
		service.createWord(word, x, y, vert);

		//	Score setup
		showScore(scoreMatrix());
	},

	//	pos: { word, x, y, vert }
	moveWordInMatrix = function(oldPos, newPos){
		//	Update the word in the placedWords
		for(var i = 0; i < args.placedWords.length; i += 1) {
			var pw = args.placedWords[i];
			if(oldPos.word == pw.word && 
				oldPos.x == pw.x && 
				oldPos.y == pw.y && 
				oldPos.vert == pw.vert 
			) {
				args.placedWords[i].x = newPos.x;
				args.placedWords[i].y = newPos.y;
			}
		}

		// Sync the matrix 
		//	TODO: We should only create the matrix when we need it.
		//constructMatrix(args.placedWords);
		//	Score setup
		showScore(scoreMatrix());
	},

	debugMatrix = function(mat){
		var result = "", tmp;

		for(var x = 0; x < args.matrixSize[0]; x += 1) {
			tmp = [];
			for(var y = 0; y < args.matrixSize[1]; y += 1) {
				if(mat[x]) {
					tmp.push((mat[y][x]? mat[y][x]: ".") + " ");
				}
			}
			result += tmp.join("") + "\n";
		}

		return result;
	},

	//	Creates a text array version of the matrix based on placed words
	constructMatrix = function(words){
		var mat = [];
		for(var y = 0; y < args.matrixSize[1]; y += 1) {
			mat[y] = [];
			for(var x = 0; x < args.matrixSize[0]; x += 1) {
				mat[y][x] = "";
			}
		}

		//	Now add the words
		for(var i = 0; i < words.length; i += 1) {
			var w = words[i], count = 0;

			if(!w.vert) {
				for(var ix = w.x; ix < w.x + w.word.length; ix += 1) {
					mat[ix][w.y] = w.word.charAt(count);
					count += 1;
				}
			} else {
				for(var iy = w.y; iy < w.y + w.word.length; iy += 1) {
					mat[w.x][iy] = w.word.charAt(count);
					count += 1;
				}
			}

		}

		return mat;
	},

	//	Scores the contents of the matrix
	scoreMatrix = function() {
		var myMatrix = constructMatrix(args.placedWords);

		//	Set the inital score offset (based on letters already in the matrix)
		var score = (args.initScore)? -args.initScore: 0,
			xWidth = args.matrixSize[0] - 1,
			yWidth = args.matrixSize[1] - 1,
			//	See how many letters are near this letter
			peekAround = function(x, y) {
				var result = 0;
				if( y > 0 && myMatrix[x][y-1] && myMatrix[x][y-1] !== "") {
					result += 1;
				}
				if( y < yWidth && myMatrix[x][y+1] && myMatrix[x][y+1] !== "") {
					result += 1;
				}
				if( x > 0 && myMatrix[x-1][y] && myMatrix[x-1][y] !== "") {
					result += 1;
				}
				if( x < xWidth && myMatrix[x+1][y] && myMatrix[x+1][y] !== "") {
					result += 1;
				}
				return result;
			};

		for(var y = 0; y < args.matrixSize[1]; y += 1) {
			for(var x = 0; x < args.matrixSize[0]; x += 1) {
				if(myMatrix[x][y] && myMatrix[x][y] !== "" ) {
					score += peekAround(x,y) + args.scoreTable[myMatrix[x][y]];
				}
			}
		}

		//	testing - show the matrix in text form
		//console.log(debugMatrix(myMatrix));

		return score;
	},

	scorePlaceholder,

	// //	Shows the score on the board
	showScore = function(score) {
		score = score || 0;
		var text = "SCORE: " + score,
			style;

		if(!scorePlaceholder) {
			style = { font: "32px Arial", fill: "#000044", align: "right" };

			scorePlaceholder = game.add.text(game.world.width, 0, text, style);
			scorePlaceholder.anchor.setTo(1, 0);
		} else {
			scorePlaceholder.setText(text);
		}

		return scorePlaceholder;
	},


	//	This is run in the update loop
	update = function(){
		if(updateQueue.length > 0) {
			for(i = 0; i < updateQueue.length; i += 1) {
				updateQueue[i]();
			}
		}
	};

	return {
		createWord: createWord,
		update: update,
		initWords: initWords,
		debugMatrix: debugMatrix,
		scoreMatrix: scoreMatrix
	};

};