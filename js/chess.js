(function($) {
	var debug = true,
		xq = {
			board: $('<div class="board"></div>'),
			chessLayer: $('<div class="chess-layer"></div>'),
			helperLayer: $('<div class="helper-layer"></div>'),
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
			chess: $('<div class="c-' + (/[A-Z]/.test(t) ? 'r' : 'b') + ' c-' + t + '" id="' + k + '"></div>')
		};
	});

	/**
	 * init the game board
	 * add chess board to dom
	 * add chess sprites to board
	 */
	function _init() {
		$.each(xq.sprites, function(key, sprite) {
			xq.chessLayer.append(_put(sprite.chess, sprite.coord));
		});
		xq.board.append(xq.helperLayer).append(xq.chessLayer);
		$('body').append(xq.board);
		$('.c-b,.c-r', xq.chessLayer).draggable({
			cursor: "move",
			helper: "clone",
			grid: [55, 55]
		}).on('dragstart',function() {
				$(this).css({opacity: 0.5});
			}).on('dragstop',function(e, ui) {
				$(this).css({opacity: 1});
				_clearHelper();
				_move($(this), _posToCoord(ui.position));
			}).on('mousedown',function() {
				_showHelper($(this));
			}).on('mouseup', function() {
				_clearHelper();
			});
	}

	/**
	 * translate data to coord
	 * @param {number} data 1-90
	 * @returns {Array}
	 */
	function _dataToCoord(data) {
		return [((data - 0.5) % 9 | 0) + 1, (data + 8) / 9 | 0]
	}

	/**
	 * translate coord to data
	 * @param {Array} coord [x,y]
	 * @returns {number}
	 */
	function _coordToData(coord) {
		return coord[0] + coord[1] * 9 - 9;
	}

	/**
	 * @param {Array} coord [x,y]
	 */
	function _coordToPos(coord) {
		return { left: 55 * coord[0], top: 55 * coord[1] }
	}

	/**
	 * @param {Array} pos [x,y]
	 */
	function _posToCoord(pos) {
		return [ pos.left / 55 | 0, pos.top / 55 | 0 ];
	}

	/**
	 * find chess sprite by a coord
	 * @param {number} x
	 * @param {number} y
	 */
	function _findSprite(x, y) {
		var retSprite = false;
		$.each(xq.sprites, function(key, sprite) {
			if (!retSprite && sprite.coord[0] == x && sprite.coord[1] == y) { retSprite = sprite; }
		});
		return retSprite;
	}

	/**
	 * fix number, ovject format coord to array format
	 * @param {Array|object|number} x
	 * @param {number} [y]
	 */
	function _fixCoord(x, y) {
		if ($.isArray(x) && x.length == 2) { return x; }
		else if ($.isNumeric(x) && $.isNumeric(y)) { return [+x, +y]; }
		return [-1, -1];
	}

	/**
	 * count chess number between 2 coords
	 * @param {Array} coord1
	 * @param {Array} coord2
	 * @returns {number}
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
	 */
	function _drawHelper() {
		var me = this;
		$.each(arguments, function(index, coord) {
			if ($.isNumeric(coord)) { coord = _dataToCoord(coord); }
			var x = coord[0], y = coord[1];
			if (_checkMove(me, x, y)) {
				if (xq.matrix[x][y] == '.') {
					xq.helperLayer.append(_put($('<div class="helper-s"></div>'), x, y));
				} else {
					xq.helperLayer.append(_put($('<div class="helper-c"></div>'), x, y));
				}
				xq.hasHelper = true;
			}
		})
	}

	/**
	 * clear all helper which shows on layer
	 */
	function _clearHelper() {
		if (xq.hasHelper) {
			xq.helperLayer.empty();
			xq.hasHelper = false;
		}
	}

	/**
	 * put chess to coord
	 * @param {object} dom jquery selector
	 * @param {Array|object|number} x
	 * @param {number} [y]
	 * @return {object} dom this
	 */
	function _put(dom, x, y) {
		var coord = _fixCoord(x, y),
			sprite = xq.sprites[dom.attr('id')];
		if (sprite) {
			xq.matrix[coord[0]][coord[1]] = sprite.type;
			sprite.coord = coord;
		}
		dom.css(_coordToPos(coord));
		return dom;
	}

	/**
	 * move chess to coord with animation
	 * @param {object} dom jquery selector
	 * @param {Array|object|number} x
	 * @param {number} [y]
	 */
	function _move(dom, x, y) {
		var coord = _fixCoord(x, y), x1 = coord[0], y1 = coord[1],
			sprite = xq.sprites[dom.attr('id')], target = _findSprite(x1, y1);

		if (sprite && _checkMove(dom, coord)) {
			_clearHelper();
			xq.matrix[sprite.coord[0]][sprite.coord[1]] = '.';
			xq.matrix[x1][y1] = sprite.type;
			xq.chessLayer.append(sprite.chess);

			xq.history.push(sprite.index, _coordToData([x1, y1]));
			sprite.coord = coord;
			sprite.chess.animate(_coordToPos(coord), function() {
				if (target && target.chess) {
					target.chess.remove();
					xq.history.push(-target.index);
				}
			});
		}
	}

	/**
	 * show the chess helper to see where can put down the chess
	 * @param {object} dom jquery selector
	 */
	function _showHelper(dom) {
		var sprite = xq.sprites[dom.attr('id')], t = sprite.type,
			x = sprite.coord[0], y = sprite.coord[1];

		_clearHelper();
		if (t == 'J' || t == 'j' || t == 'P' || t == 'p') {
			_drawHelper.call(dom, [x, 1], [x, 2], [x, 3], [x, 4], [x, 5], [x, 6], [x, 7], [x, 8], [x, 9], [x, 10], [1, y], [2, y], [3, y], [4, y], [5, y], [6, y], [7, y], [8, y], [9, y]);
		} else if (t == 'M' || t == 'm') {
			_drawHelper.call(dom, [x - 2, y - 1], [x - 1, y - 2], [x + 1, y - 2], [x + 2, y - 1], [x + 2, y + 1], [x + 1, y + 2], [x - 1, y + 2], [x - 2, y + 1]);
		} else if (t == 'X') {
			_drawHelper.call(dom, 3, 7, 19, 23, 27, 39, 43);
		} else if (t == 'x') {
			_drawHelper.call(dom, 84, 88, 64, 68, 72, 48, 52);
		} else if (t == 'S') {
			_drawHelper.call(dom, 4, 22, 14, 6, 24);
		} else if (t == 's') {
			_drawHelper.call(dom, 67, 85, 77, 69, 87);
		} else if (t == 'K') {
			_drawHelper.call(dom, 4, 13, 22, 5, 14, 23, 6, 15, 24);
		} else if (t == 'k') {
			_drawHelper.call(dom, 67, 76, 85, 68, 77, 86, 69, 78, 87);
		} else if (t == 'Z') {
			_drawHelper.call(dom, [x - 1, y], [x + 1, y], [x, y + 1]);
		} else { //if (t == 'z')
			_drawHelper.call(dom, [x - 1, y], [x + 1, y], [x, y - 1]);
		}
	}

	/**
	 * check is the target coord an be move on
	 * @param {object} dom jquery selector
	 * @param {Array|object|number} x
	 * @param {number} [y]
	 * @returns {boolean}
	 */
	function _checkMove(dom, x, y) {
		var sprite = xq.sprites[dom.attr('id')], t = sprite.type,
			nc = _fixCoord(x, y), nx = nc[0], ny = nc[1],
			oc = sprite.coord, ox = oc[0], oy = oc[1], od = _coordToData(oc);

		if (nx < 1 || nx > 9 || ny < 0 || ny > 10 //coordinate protect
			|| /[a-z]{2}|[A-Z]{2}/.test(xq.matrix[nx][ny] + sprite.type)) { //if target coord has own side chess, move should failed
			return false;
		}

		if (t == 'J' || t == 'j') {
			return ((nx == ox || ny == oy) //one of abscissa or ordinate must equal
				&& _countChess(nc, oc) === 0); //no chess between initial coord and target coord
		} else if (t == 'M' || t == 'm') {
			return((Math.abs(nx - ox) == 2 && Math.abs(ny - oy) == 1 && xq.matrix[(nx + ox) / 2][oy] == '.') //abscissa
				|| (Math.abs(nx - ox) == 1 && Math.abs(ny - oy) == 2 && xq.matrix[ox][(ny + oy) / 2] == '.'));
		} else if (t == 'X' || t == 'x') {
			return (Math.abs(nx - ox) == 2 //offset of abscissas limit to 2
				&& xq.matrix[(nx + ox) / 2][(ny + oy) / 2] == '.' //no chess between initial coord and target coord
				&& ((t == 'X' && $.inArray(od, [3, 7, 19, 23, 27, 39, 43] != -1)) //all valid coordinate
				|| (t == 'x' && $.inArray(od, [84, 88, 64, 68, 72, 48, 52] != -1)))); //all valid coordinate
		} else if (t == 'S' || t == 's') {
			return ((Math.abs(nx - ox) == 1 && (Math.abs(ny - oy) == 1)) //offset 1 on ordinate and ordinate
				&& ((t == 'S' && $.inArray(od, [4, 22, 14, 6, 24] != -1)) //all valid coordinate
				|| (t == 's' && $.inArray(od, [67, 85, 77, 69, 87] != -1)))); //all valid coordinate
		} else if (t == 'K' || t == 'k') {
			return (((Math.abs(nx - ox) == 1 && ny == oy) //offset 1 on abscissa
				|| (Math.abs(ny - oy) == 1 && nx == ox)) //offset 1 on ordinate
				&& ((t == 'K' && $.inArray(od, [4, 13, 22, 5, 14, 23, 6, 15, 24] != -1)) //all valid coordinate
				|| (t == 'k' && $.inArray(od, [67, 76, 85, 68, 77, 86, 69, 78, 87] != -1)))); //all valid coordinate
		} else if (t == 'P' || t == 'p') {
			return ((nx == ox || ny == oy) //one of abscissa or ordinate must equal
				&& (((xq.matrix[nx][ny]) != '.' && _countChess(nc, oc) === 1) //must have one chess between initial coord and target coord if target is opposite chess
				|| ((xq.matrix[nx][ny]) == '.' && _countChess(nc, oc) === 0))); //must have one chess between initial coord and target coord if target is empty
		} else if (t == 'Z') {
			return ((nx == ox && ny == oy + 1) //go forward
				|| (oy >= 6 && ((nx == ox - 1 && ny == oy) || (nx == ox + 1 && ny == oy)))); //go side
		} else { //if (t=='z')
			return ((nx == ox && ny == oy - 1) //go forward
				|| (oy <= 5 && ((nx == ox - 1 && ny == oy) || (nx == ox + 1 && ny == oy)))); //go side
		}
	}

	_init();

	//for debug
	if (debug) {
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
		 * return a visual matrix
		 * @returns {string}
		 */
		window.showHistory = function() {
			var retStr = '', p = 0, h = xq.history, d = xq.spritesData;
			while (p < h.length) {
				retStr += '\n' + d[h[p++]] + ' move to ' + _dataToCoord(h[p++]).join(',');
				if (h[p] < 0) { retStr += ', ' + d[-h[p++]] + ' was be ate.' }
			}
			return retStr;
		};

		/**
		 * show visual help on board
		 */
		window.showCoord = function() {
			xq.coordLayer = $('<div class="coord-layer"></div>');
			xq.board.prepend(xq.coordLayer);
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

		$.each(xq.sprites, function(key, sprite) {
			window[key] = sprite.chess;
		});

		window.xq = xq;
		window.move = _move;
	}
}(jQuery));