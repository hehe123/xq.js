(function($) {
	var debug = true,
		xq = {
			board: $('<div class="board"></div>'),
			chessLayer: $('<div class="chess-layer"></div>'),
			helperLayer: $('<div class="helper-layer"></div>'),
			coordLayer: $('<div class="coord-layer"></div>'),
			sprites: {},
			spritesData: [],
			matrix: [],
			history: []
		};

	for (var i = 0; i <= 9; i++) { xq.matrix.push('...........'.split('')); }
	$.each('J11,M12,X13,S14,K15,S26,X27,M28,J29,P120,P226,Z128,Z230,Z332,Z434,Z536,j182,m183,x184,s185,k186,s287,x288,m289,j290,p165,p271,z155,z257,z359,z461,z563'.split(','), function(i, v) {
		var k = v.substr(0, 2), t = v.substr(0, 1);
		xq.spritesData.push(k);
		xq.sprites[k] = {
			index: i, name: k, type: t, coord: _dataToCoord(+v.substr(2)),
			chess: $('<div class="c-' + (/[A-Z]/.test(t) ? 'r' : 'b') + ' c-' + t + '"></div>')
		};
	});

	/**
	 * init the game board
	 * add chess board to dom
	 * add chess sprites to board
	 * @private
	 */
	function _init() {
		$('body').append(xq.board).append(xq.coordLayer).append(xq.helperLayer).append(xq.chessLayer);
		$.each(xq.sprites, function(key, sprite) {
			xq.chessLayer.append(sprite.chess.putTo(sprite.coord));
		});
		$('.c-b').add('.c-r').draggable({
			cursor: "move",
			helper: "clone",
			grid: [55, 55]
		}).on('dragstart',function(e) {
				$(this).css({opacity: 0.5});
			}).on('dragstop',function(e, ui) {
				$(this).css({opacity: 1});
				_clearHelper();
				$(this).moveTo(_posToCoord(ui.position));
			}).on('mousedown',function() {
				$(this).showHelper();
			}).on('mouseup', function() {
				_clearHelper();
			});
	}

	/**
	 * translate data to coord
	 * @param {number} data 1-90
	 * @returns {Array}
	 * @private
	 */
	function _dataToCoord(data) {
		return [((data - 0.5) % 9 | 0) + 1, (data + 8) / 9 | 0]
	}

	/**
	 * translate coord to data
	 * @param {array} coord [x,y]
	 * @returns {number}
	 * @private
	 */
	function _coordToData(coord) {
		return coord[0] + coord[1] * 9 - 9;
	}

	/**
	 * @param {array} coord [x,y]
	 * @private
	 */
	function _coordToPos(coord) {
		return { left: 55 * coord[0], top: 55 * coord[1] }
	}

	/**
	 * @param {object} pos [x,y]
	 * @private
	 */
	function _posToCoord(pos) {
		return { x: pos.left / 55 | 0, y: pos.top / 55 | 0 }
	}

	/**
	 * find chess sprite by dom selector or a coord
	 * @param {dom|number} x
	 * @param {number} [y]
	 * @private
	 */
	function _findSprite(x, y) {
		var retSprite = false;
		$.each(xq.sprites, function(key, sprite) {
			if (!retSprite && ((x.eq && x[0] == sprite.chess[0]) ||
				(sprite.coord[0] == x && sprite.coord[1] == y))) { retSprite = sprite; }
		});
		return retSprite;
	}

	/**
	 * fix number, ovject format coord to array format
	 * @param {array|object|number} x
	 * @param {number} [y]
	 * @private
	 */
	function _fixCoord(x, y) {
		if ($.isArray(x) && x.length == 2) { y = +x[1], x = +x[0]; }
		else if ($.isPlainObject(x) && x.x && x.y) { y = +x.y, x = +x.x; }
		else if ($.isNumeric(x) && $.isNumeric(y)) { x = +x, y = +y; }
		else { x = -1, y = -1; }
		return [x, y];
	}

	/**
	 * test is the coord in a coord array
	 * @param {array} coord
	 * @param {array|string} coordArray
	 * @returns {boolean}
	 * @private
	 */
	function _inCoordArray(coord, coordArray) {
		var retResult = false;
		$.each(coordArray, function(index, cCoord) {
			cCoord = _dataToCoord(cCoord);
			if (!retResult && coord[0] === cCoord[0] && coord[1] === cCoord[1]) {
				retResult = true;
			}
		})
		return retResult;
	}

	/**
	 * count chess number between 2 coords
	 * @param {array} coord1
	 * @param {array} coord2
	 * @returns {number}
	 * @private
	 */
	function _countChess(coord1, coord2) {
		var x, y, x1 = coord1[0], y1 = coord1[1], x2 = coord2[0], y2 = coord2[1], count = 0;
		if (x1 != x2 && y1 != y2) { return -1; }
		if (x1 == x2) {
			if (y1 > y2) { y1 = y1 + y2, y2 = y1 - y2, y1 = y1 - y2; }
			for (y = y1 + 1; y < y2; y++) { if (xq.matrix[x1][y] != '.') {count++;}}
		} else {
			if (x1 > x2) { x1 = x1 + x2, x2 = x1 - x2, x1 = x1 - x2; }
			for (x = x1 + 1; x < x2; x++) { if (xq.matrix[x][y1] != '.') {count++;}}
		}
		return count;
	}

	/**
	 * draw Helper
	 * @private
	 */
	function _drawHelper() {
		var me = this.eq(0);
		$.each(arguments, function(index, coord) {
			if ($.isNumeric(coord)) { coord = _dataToCoord(coord); }
			var x = coord[0], y = coord[1];
			if (me.checkMove(x, y)) {
				if (xq.matrix[x][y] == '.') {
					xq.helperLayer.append($('<div class="helper-s"></div>').putTo(x, y));
				} else {
					xq.helperLayer.append($('<div class="helper-c"></div>').putTo(x, y));
				}
				xq.hasHelper = true;
			}
		})
		return this;
	};

	/**
	 * clear all helper which shows on layer
	 * @private
	 */
	function _clearHelper() {
		if (xq.hasHelper) {
			xq.helperLayer.empty();
			xq.hasHelper = false;
		}
	}

	$.fn.extend({
		/**
		 * put chess to coord
		 * @param {array|object|number} x
		 * @param {number} [y]
		 * @return {selector} this
		 */
		putTo: function(x, y) {
			var coord = _fixCoord(x, y),
				sprite = _findSprite(this);
			if (sprite) {
				xq.matrix[coord[0]][coord[1]] = sprite.type;
				sprite.coord = coord;
			}
			this.eq(0).css(_coordToPos(coord));
			return this;
		},

		/**
		 * move chess to coord with animation
		 * @param {array|object|number} x
		 * @param {number} [y]
		 * @return {selector} this
		 */
		moveTo: function(x, y) {
			var coord = _fixCoord(x, y),
				sprite = _findSprite(this);
			x = coord[0], y = coord[1];
			var target = _findSprite(x, y);

			if (sprite && this.checkMove(coord)) {
				_clearHelper();
				xq.matrix[sprite.coord[0]][sprite.coord[1]] = '.';
				xq.matrix[x][y] = sprite.type;
				xq.chessLayer.append(sprite.chess);
				sprite.coord = coord;
				sprite.chess.animate(_coordToPos(coord), function() {
					if (target && target.chess) { target.chess.remove(); }
				});
				xq.history.push([sprite.name, x, y, target.name]);
				return this;
			} else { return false;}
		},

		/**
		 * check is the target coord an be move on
		 * @param {array|object|number} x
		 * @param {number} [y]
		 * @returns {boolean}
		 */
		checkMove: function(x, y) {
			var sprite = _findSprite(this),
				nc = _fixCoord(x, y),
				oc = sprite.coord,
				x, y;

			//coordinate protect
			if (nc[0] < 1 || nc[0] > 9 || nc[1] < 0 || nc[1] > 10) {
				return false;
			}
			//if target coord has own side chess, move should failed
			if (/[a-z]{2}|[A-Z]{2}/.test(xq.matrix[nc[0]][nc[1]] + sprite.type)) {
				return false;
			}

			if (nc) {
				switch (sprite.type) {
				case 'J':
				case 'j':
					return ((nc[0] == oc[0] || nc[1] == oc[1]) //one of abscissa or ordinate must equal
						&& _countChess(nc, oc) === 0); //no chess between initial coord and target coord
				case 'M':
				case 'm':
					return((Math.abs(nc[0] - oc[0]) == 2 && Math.abs(nc[1] - oc[1]) == 1 && xq.matrix[(nc[0] + oc[0]) / 2][oc[1]] == '.') //abscissa
						|| (Math.abs(nc[0] - oc[0]) == 1 && Math.abs(nc[1] - oc[1]) == 2 && xq.matrix[oc[0]][(nc[1] + oc[1]) / 2] == '.'));
				case 'X':
					return (Math.abs(nc[0] - oc[0]) == 2 //offset of abscissas limit to 2
						&& xq.matrix[(nc[0] + oc[0]) / 2][(nc[1] + oc[1]) / 2] == '.' //no chess between initial coord and target coord
						&& _inCoordArray(nc, '[[3,1],[7,1],[1,3],[5,3],[9,3],[3,5],[7,5]]')); //all valid coordinate
				case 'x':
					return (Math.abs(nc[0] - oc[0]) == 2 //offset of abscissas limit to 2
						&& xq.matrix[(nc[0] + oc[0]) / 2][(nc[1] + oc[1]) / 2] == '.' //no chess between initial coord and target coord
						&& _inCoordArray(nc, '[[3,10],[7,10],[1,8],[5,8],[9,8],[3,6],[7,6]]')); //all valid coordinate
				case 'S':
					return ((Math.abs(nc[0] - oc[0]) == 1 && (Math.abs(nc[1] - oc[1]) == 1)) //offset 1 on ordinate and ordinate
						&& _inCoordArray(nc, '[[4,1],[4,3],[5,2],[6,1],[6,3]]')); //all valid coordinate
				case 's':
					return ((Math.abs(nc[0] - oc[0]) == 1 && (Math.abs(nc[1] - oc[1]) == 1)) //offset 1 on ordinate and ordinate
						&& _inCoordArray(nc, '[[4,8],[4,10],[5,9],[6,8],[6,10]]')); //all valid coordinate
				case 'K':
					return (((Math.abs(nc[0] - oc[0]) == 1 && nc[1] == oc[1]) //offset 1 on abscissa
						|| (Math.abs(nc[1] - oc[1]) == 1 && nc[0] == oc[0])) //offset 1 on ordinate
						&& _inCoordArray(nc, '[[4,1],[4,2],[4,3],[5,1],[5,2],[5,3],[6,1],[6,2],[6,3]]')); //all valid coordinate
				case 'k':
					return (((Math.abs(nc[0] - oc[0]) == 1 && nc[1] == oc[1]) //offset 1 on abscissa
						|| (Math.abs(nc[1] - oc[1]) == 1 && nc[0] == oc[0])) //offset 1 on ordinate
						&& _inCoordArray(nc, '[[4,8],[4,9],[4,10],[5,8],[5,9],[5,10],[6,8],[6,9],[6,10]]')); //all valid coordinate
				case 'P':
				case 'p':
					return ((nc[0] == oc[0] || nc[1] == oc[1]) //one of abscissa or ordinate must equal
						&& (((xq.matrix[nc[0]][nc[1]]) != '.' && _countChess(nc, oc) === 1) //must have one chess between initial coord and target coord if target is opposite chess
						|| ((xq.matrix[nc[0]][nc[1]]) == '.' && _countChess(nc, oc) === 0))); //must have one chess between initial coord and target coord if target is empty
				case 'Z':
					return ((nc[0] == oc[0] && nc[1] == oc[1] + 1) //go forward
						|| (oc[1] >= 6
						&& ((nc[0] == oc[0] - 1 && nc[1] == oc[1]) //go side
						|| (nc[0] == oc[0] + 1 && nc[1] == oc[1])))); //go side
				case 'z':
					return ((nc[0] == oc[0] && nc[1] == oc[1] - 1) //go forward
						|| (oc[1] <= 5
						&& ((nc[0] == oc[0] - 1 && nc[1] == oc[1]) //go side
						|| (nc[0] == oc[0] + 1 && nc[1] == oc[1])))); //go side
				}
			}
			return true;
		},

		/**
		 * show the chess helper to see where can put down the chess
		 */
		showHelper: function() {
			var sprite = _findSprite(this),
				x = sprite.coord[0], y = sprite.coord[1];

			_clearHelper();
			switch (sprite.type) {
			case 'J':
			case 'j':
			case 'P':
			case 'p':
				return _drawHelper.call(this, [x, 1], [x, 2], [x, 3], [x, 4], [x, 5], [x, 6], [x, 7], [x, 8], [x, 9], [x, 10], [1, y], [2, y], [3, y], [4, y], [5, y], [6, y], [7, y], [8, y], [9, y]);
			case 'M':
			case 'm':
				return _drawHelper.call(this, [x - 2, y - 1], [x - 1, y - 2], [x + 1, y - 2], [x + 2, y - 1], [x + 2, y + 1], [x + 1, y + 2], [x - 1, y + 2], [x - 2, y + 1]);
			case 'X':
				return _drawHelper.call(this, 3, 7, 19, 23, 27, 39, 43);
			case 'x':
				return _drawHelper.call(this, 84, 88, 64, 68, 72, 48, 52);
			case 'S':
				return _drawHelper.call(this, 4, 22, 14, 6, 24);
			case 's':
				return _drawHelper.call(this, 67, 85, 77, 69, 87);
			case 'K':
				return _drawHelper.call(this, 4, 13, 22, 5, 14, 23, 6, 15, 24);
			case 'k':
				return _drawHelper.call(this, 67, 76, 85, 68, 77, 86, 69, 78, 87);
			case 'Z':
				return _drawHelper.call(this, [x - 1, y], [x + 1, y], [x, y + 1]);
			case 'z':
				return _drawHelper.call(this, [x - 1, y], [x + 1, y], [x, y - 1]);
			}
		}
	});

	_init();

	//for debug
	if (debug) {
		window.xq = xq;
		/**
		 * return a visual matrix
		 * @returns {string}
		 */
		window.showMatrix = function() {
			var retStr = '\n';
			for (var y = 1; y <= 10; y++) {
				for (var x = 1; x <= 9; x++) {
					retStr += xq.matrix[x][y] + ' ';
				}
				retStr += '\n';
			}
			return retStr;
		};

		/**
		 * show visual help on board
		 */
		window.showCoord = function() {
			for (var y = 1; y <= 10; y++) {
				for (var x = 1; x <= 9; x++) {
					xq.coordLayer.append($('<div class="coord">' + x + ',' + y + '</div>')
						.css({ left: 55 * x + 12, top: 55 * y + 20 }));
				}
			}
			$.each(xq.sprites, function(key, sprite) {
				sprite.chess.append('<span>' + key + '</span>');
			});
		};

		window.chess = {};
		$.each(xq.sprites, function(key, sprite) {
			chess[key] = sprite.chess;
		});
	}
}(jQuery));