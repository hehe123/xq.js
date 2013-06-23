(function($) {
	var debug = true,
		xq = {
			board: $('<div class="board"></div>'),
			chessLayer: $('<div class="chess-layer"></div>'),
			helperLayer: $('<div class="helper-layer"></div>'),
			infoLayer: $('<div class="info-layer"></div>'),
			sprites: {},
			spritesData: [],
			matrix: [],
			history: [],
			l10n: {}

		};

	for (var i = 0; i <= 9; i++) { xq.matrix.push('...........'.split('')); }
	//前进go forward，后退draw back，前front，后latter，中center
	$.each('j車,m馬,x相,s仕,k帥,p炮,z兵,J車,M馬,X象,S士,K將,P炮,Z卒,1一,2二,3三,4四,5五,6六,7七,8八,9九,g进,d退,t平,f前,l后,c中,r红,b黑'.split(','), function(i, v) {
		xq.l10n[v.substr(0, 1)] = v.substr(1);
	});

	$.each('j11,m12,x13,s14,k15,s26,x27,m28,j29,p120,p226,z128,z230,z332,z434,z536,J182,M183,X184,S185,K186,S287,X288,M289,J290,P165,P271,Z155,Z257,Z359,Z461,Z563'.split(','), function(i, v) {
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
		xq.board.append(xq.helperLayer).append(xq.chessLayer).append(xq.infoLayer);
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
	 * @param {Array} pos [x,y]
	 */
	function _posToCoord(pos) {
		return [ pos.left / 55 | 0, pos.top / 55 | 0 ];
	}

	/**
	 * @param {Array} coord [x,y]
	 */
	function _coordToPos(coord) {
		return { left: 55 * coord[0], top: 55 * coord[1] }
	}

	/**
	 * find chess sprite by a coord
	 * @param {Array} coord
	 */
	function _findSprite(coord) {
		var retSprite = false;
		$.each(xq.sprites, function(key, sprite) {
			var c = sprite.coord;
			if (!retSprite && c[0] == coord[0] && c[1] == coord[1]) { retSprite = sprite; }
		});
		return retSprite;
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
	 * show the chess helper to see where can put down the chess
	 * @param {object} dom jquery selector
	 */
	function _showHelper(dom) {
		var sprite = xq.sprites[dom.attr('id')], t = sprite.type,
			x = sprite.coord[0], y = sprite.coord[1];

		_clearHelper();
		if (/[jp]/i.test(t)) {
			_drawHelper.call(dom, [x, 1], [x, 2], [x, 3], [x, 4], [x, 5], [x, 6], [x, 7], [x, 8], [x, 9], [x, 10], [1, y], [2, y], [3, y], [4, y], [5, y], [6, y], [7, y], [8, y], [9, y]);
		} else if (t == 'M' || t == 'm') {
			_drawHelper.call(dom, [x - 2, y - 1], [x - 1, y - 2], [x + 1, y - 2], [x + 2, y - 1], [x + 2, y + 1], [x + 1, y + 2], [x - 1, y + 2], [x - 2, y + 1]);
		} else if (t == 'X') {
			_drawHelper.call(dom, 84, 88, 64, 68, 72, 48, 52);
		} else if (t == 'x') {
			_drawHelper.call(dom, 3, 7, 19, 23, 27, 39, 43);
		} else if (t == 'S') {
			_drawHelper.call(dom, 67, 85, 77, 69, 87);
		} else if (t == 's') {
			_drawHelper.call(dom, 4, 22, 14, 6, 24);
		} else if (t == 'K') {
			_drawHelper.call(dom, 67, 76, 85, 68, 77, 86, 69, 78, 87);
		} else if (t == 'k') {
			_drawHelper.call(dom, 4, 13, 22, 5, 14, 23, 6, 15, 24);
		} else if (t == 'z') {
			_drawHelper.call(dom, [x - 1, y], [x + 1, y], [x, y + 1]);
		} else { //if (t == 'z')
			_drawHelper.call(dom, [x - 1, y], [x + 1, y], [x, y - 1]);
		}
	}

	/**
	 * draw Helper
	 */
	function _drawHelper() {
		var me = this;
		$.each(arguments, function(index, coord) {
			if ($.isNumeric(coord)) { coord = _dataToCoord(coord); }
			var x = coord[0], y = coord[1];
			if (_checkMove(me, [x, y])) {
				if (xq.matrix[x][y] == '.') {
					xq.helperLayer.append(_put($('<div class="helper-s"></div>'), [x, y]));
				} else {
					xq.helperLayer.append(_put($('<div class="helper-c"></div>'), [x, y]));
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
	 * @param {Array} coord
	 * @return {object} dom this
	 */
	function _put(dom, coord) {
		var sprite = xq.sprites[dom.attr('id')];
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
	 * @param {Array} coord
	 */
	function _move(dom, coord) {
		var x1 = coord[0], y1 = coord[1],
			sprite = xq.sprites[dom.attr('id')], target = _findSprite(coord);

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
	 * check is the target coord an be move on
	 * @param {object} dom jquery selector
	 * @param {Array} coord
	 * @returns {boolean}
	 */
	function _checkMove(dom, coord) {
		var sprites = xq.sprites, sprite = sprites[dom.attr('id')], t = sprite.type, m = xq.matrix,
			nc = coord, nx = nc[0], ny = nc[1], nd = _coordToData(nc), kc = sprites['k1'].coord, Kc = sprites['K1'].coord,
			oc = sprite.coord, ox = oc[0], oy = oc[1], dx = Math.abs(nx - ox), dy = Math.abs(ny - oy);

		return !(nx < 1 || nx > 9 || ny < 0 || ny > 10 //coordinate protect
			|| /[a-z]{2}|[A-Z]{2}/.test(m[nx][ny] + sprite.type))  //if target coord has own side chess, move should failed
			&& (((t == 'J' || t == 'j')
			&& ((nx == ox || ny == oy) //one of abscissa or ordinate must equal
			&& _countChess(nc, oc) === 0)) //no chess between initial coord and target coord
			|| ((t == 'M' || t == 'm')
			&& ((dx == 2 && dy == 1 && m[(nx + ox) / 2][oy] == '.') //abscissa
			|| (dx == 1 && dy == 2 && m[ox][(ny + oy) / 2] == '.')))
			|| ((t == 'X' || t == 'x')
			&& ( dx == 2 //offset of abscissas limit to 2
			&& m[(nx + ox) / 2][(ny + oy) / 2] == '.' //no chess between initial coord and target coord
			&& ((t == 'x' && $.inArray(nd, [3, 7, 19, 23, 27, 39, 43]) != -1) //all valid coordinate
			|| (t == 'X' && $.inArray(nd, [84, 88, 64, 68, 72, 48, 52]) != -1)))) //all valid coordinate
			|| ((t == 'S' || t == 's')
			&& ((dx == 1 && (dy == 1)) //offset 1 on ordinate and ordinate
			&& ((t == 's' && $.inArray(nd, [4, 22, 14, 6, 24]) != -1) //all valid coordinate
			|| (t == 'S' && $.inArray(nd, [67, 85, 77, 69, 87]) != -1)))) //all valid coordinate
			|| ((t == 'P' || t == 'p')
			&& !(kc[0] == Kc[0] && kc[0] == ox && ox == nx && _countChess(kc, Kc) == 1 && (ny < kc[1] || ny > Kc[1])) //Pao and Kings at same ordinate
			&& (((nx == ox || ny == oy) //one of abscissa or ordinate must equal
			&& (((m[nx][ny]) != '.' && _countChess(nc, oc) === 1) //must have one chess between initial coord and target coord ||(target is opposite chess
			|| ((m[nx][ny]) == '.' && _countChess(nc, oc) === 0))))) //must have one chess between initial coord and target coord ||(target is empty
			|| ((t == 'z')
			&& (((nx == ox && ny == oy + 1 && oy != 10) //go forward
			|| (oy >= 6 && ((nx == ox - 1 && ny == oy) || (nx == ox + 1 && ny == oy)))))) //go side
			|| ((t == 'Z')
			&& (((nx == ox && ny == oy - 1 && oy != 1) //go forward
			|| (oy <= 5 && ((nx == ox - 1 && ny == oy) || (nx == ox + 1 && ny == oy))))))) //go side
			&& !(kc[0] == Kc[0] && kc[0] == ox && ox != nx && _countChess(kc, Kc) == 1) //at least 1 chess between 2 kings
			|| ((t == 'K' || t == 'k')
			&& (((dx == 1 && ny == oy) || (dy == 1 && nx == ox)) //offset 1 on abscissa or ordinate
			&& ((t == 'k' && $.inArray(nd, [4, 13, 22, 5, 14, 23, 6, 15, 24]) != -1 && (nx != Kc[0] || _countChess(nc, Kc) >= 1))//all valid coordinate
			|| (t == 'K' && $.inArray(nd, [67, 76, 85, 68, 77, 86, 69, 78, 87]) != -1 && (nx != kc[0] || _countChess(nc, kc) >= 1))))); //all valid coordinate
	}

	/**
	 * check is the chess already check mate
	 * @returns {boolean}
	 * @private
	 */
	function _checkMate() {
		return false;
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
					xq.coordLayer.append($('<div class="coord">' + x + ',' + y + ',' + _coordToData([x, y]) + '</div>')
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