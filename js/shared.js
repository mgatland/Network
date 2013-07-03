(function(exports){

	this.element_type_edge = 1;
	this.element_type_corner = 2;
	this.element_type_cell = 3;

	this.direction_horizontal = 0;
	this.direction_vertical = 1;

	this.utility_type_any = 0;
	this.utility_type_road = 1;
	this.utility_type_water = 2;
	this.utility_type_electricity = 3;
	this.utility_type_internet = 4;
	this.utility_type_destroyed = 5;

	this.board_width = 6;
	this.board_height = 6;
	this.supply_points = [null, 0, 1, 2, 4];

	function edge() {
	    this.player = null;
	    this.type = null;
	}

	function corner() {
	    this.source = null;
	    this.supplies = [ ];
	}

	function cell() {
	    this.level = 0;
	    this.max_level = 1;
	    this.supplied = [null, null, null, null, null];
	    this.generator = false;
	}

	function player() {
	    this.points = 0;
	    this.cards = [ utility_type_road, utility_type_road, utility_type_road ];
	    this.next_turn_bonus_cards = [];
	    this.has_claimed_road_source = false;
	}

	player.prototype.updateData = function (data) {
		this.points = data.points;
		this.cards = data.cards;
		this.next_turn_bonus_cards = data.next_turn_bonus_cards;
		this.has_claimed_road_source = data.has_claimed_road_source;
	}

	player.prototype.giveBonusCard = function ( ) {

	    if( this.next_turn_bonus_cards.length >= 1 )
	        return;

	    this.next_turn_bonus_cards.push( randomUtility() );
	}

	player.prototype.onStartTurn = function ( ) {
	    this.cards = this.cards.concat( this.next_turn_bonus_cards );
	    this.next_turn_bonus_cards = [];

	    this.cards.push( utility_type_any );
	}

	player.prototype.onEndTurn = function( ) {
	}

	player.prototype.removeCardOfType = function ( element_type ) {
	    var card_index = this.cards.indexOf( element_type );
	    if( card_index == -1 )
	        card_index = this.cards.indexOf( 0 );
	    this.cards.splice( card_index, 1 );
	}

	player.prototype.hasCardOfType = function( element_type ) {
	    return this.cards.some( function( c ) { return c == element_type || c == 0; } );
	}

	function initCells () {
		var cells = new Array(board_height);
	    for( var y = 0; y < board_height; ++y ) {
	        cells[y] = new Array(board_width);
	        for (var x = 0; x < board_width; ++x)
	            cells[y][x] = new cell();
	    }
	    return cells;
	}

	function initEdges () {
	    var edges = [[],[]];
	    for (var i = 0; i < 2; ++i) {
	        var height = board_height + (i == 0 ? 1 : 0);
	        edges[i] = new Array(height);
	        for (var y = 0; y < height; ++y) {
	            var width = board_width + (i == 0 ? 0 : 1);
	            edges[i][y] = new Array(width);
	            for (var x = 0; x < width; ++x) {
	                edges[i][y][x] = new edge();
	            }
	        }
	    }
	    return edges;
	}

	function initPlayers() {
		return [ new player(), new player()];
	}

	function initCorners() {
	    var corners = new Array(board_height + 1);
	    for (var y = 0; y < board_height + 1; ++y) {
	        corners[y] = new Array(board_width + 1);
	        for (var x = 0; x < board_width + 1; ++x) {
	            corners[y][x] = new corner();
	        }
	    }
	    return corners;
	}

	function game( ) {
	    var self = this;
	    this.players = initPlayers();


	    this.last_player_index = 0;

	    this.edges = initEdges();

	    this.corners = initCorners();

	    this.cells = initCells();

	    //Random roads on edges of board
	    this.corners[0][ Math.floor( Math.random() * ( board_width - 1 ) ) + 1 ].source = { type: utility_type_road, owner: null };
	    this.corners[board_height][Math.floor(Math.random() * (board_width - 1)) + 1].source = { type: utility_type_road, owner: null };
	    this.corners[ Math.floor( Math.random() * ( board_width - 1 ) ) + 1 ][ 0 ].source = { type: utility_type_road, owner: null };
	    this.corners[ Math.floor(Math.random() * (board_width - 1)) + 1 ][board_height].source = { type: utility_type_road, owner: null };

	    //Random sources on corners in the middle of the board
	    for (var type = 2; type < 5; ++type)
	        for (var i = 0; i < 3; ++i) {
	            var x = Math.floor(Math.random() * (board_width - 1)) + 1;
	            var y = Math.floor(Math.random() * ((i < 2 ? 2 : board_width - 1))) + 1;
	            if (i == 1)
	                y += 3;
	            if (this.corners[y][x].source !== null) {
	                --i;
	                continue;
	            }

	            this.corners[y][x].source = { type: type, owner: null };
	        }

	    //Work out which cells are "generators" which means they generate more cards when they have powered internet
	    for( var y = 0; y < board_height; ++y )
	        for( var x = 0; x < board_width; ++x )
	            if( getAdjacentCornersToCell( { x: x, y: y }).filter( function( corner_coord ) { return self.corners[ corner_coord.y ][ corner_coord.x ].source != null } ).length < 2 )
	                self.cells[ y ][ x ].generator = true;

	    this.propogateOwnership();
	}

	game.prototype.traveseGraph = function( utility_type, player_index, start_corner_coord, propogate_to_neutral ) {

	    var self = this;
	    var to_search = [ start_corner_coord ];

	    while (to_search.length != 0) {
	        var corner_coord = to_search.pop();

	        var corner = this.corners[corner_coord.y][corner_coord.x];
	        if (player_index !== null && !corner.supplies.some(function (s) { return s.owner === player_index && s.type === utility_type } ) ) {
	            corner.supplies.push({ owner: player_index, type: utility_type });

	            if ( utility_type == utility_type_road && player_index !== null && corner.source != null && corner.source.owner == null) {
	                corner.source.owner = player_index;
	            }
	        }

	        forEachAjacentEdgeToCorner(corner_coord, function (edge_coord) {
	            var edge = self.edges[edge_coord.direction][edge_coord.y][edge_coord.x];
	            if (!edge.consumed && edge.type === utility_type && ( edge.player === player_index || ( propogate_to_neutral && edge.player === null ) ) ) {
	                edge.consumed = true;   
	                edge.player = player_index;
	                to_search.push(getOppositeCornerAlongEdge(corner_coord, edge_coord));
	            }
	        });
	    }
	}



	game.prototype.propogateOwnership = function() {

	    var self = this;

	    //Reset board state to clear the current supplies state.
	    for( var y = 0; y < board_height + 1; ++y )
	        for (var x = 0; x < board_width + 1; ++x) {
	            var corner = this.corners[y][x];
	            corner.supplies = [];
	            //Sources become unowned (unless they are roads) because they will be reconnected later
	            if (corner.source && corner.source.type != utility_type_road)
	                corner.source.owner = null;
	        }

	    
	    for (var i = 0; i < 2; ++i) {
	        var height = board_height + (i == 0 ? 1 : 0);
	        for (var y = 0; y < height; ++y) {
	            var width = board_width + (i == 0 ? 0 : 1);
	            for (var x = 0; x < width; ++x) {
	                this.edges[i][y][x].consumed = false;
	            }
	        }
	    }

	    //Travese graph starting at sources along edges owned by a player only
	    for (var type = 1; type < 5; ++type)
	        for( var y = 0; y < board_height + 1; ++y )
	            for (var x = 0; x < board_width + 1; ++x) {
	                var corner = this.corners[y][x];
	                if (corner.source && corner.source.owner !== null && corner.source.type === type)
	                    this.traveseGraph(type, corner.source.owner, { x: x, y: y }, false);
	            }

	    //Any edge that hasn't already been consumed is now unowned by any player
	    for (var i = 0; i < 2; ++i) {
	        var height = board_height + (i == 0 ? 1 : 0);
	        for (var y = 0; y < height; ++y) {
	            var width = board_width + (i == 0 ? 0 : 1);
	            for (var x = 0; x < width; ++x) {
	                var edge = this.edges[i][y][x];
	                if( !edge.consumed )
	                    edge.player = null;
	            }
	        }
	    }

	    //Traverse graph starting at all player corner sources owned by each player in turn

	    for( var type = 1; type < 5; ++type )
	        for( var y = 0; y < board_height + 1; ++y )
	            for (var x = 0; x < board_width + 1; ++x) {
	                var corner = this.corners[y][x];

	                if( corner.source && corner.source.owner !== null && corner.source.type === type )
	                    this.traveseGraph( type, corner.source.owner, { x: x, y: y }, true );

	                for( var supply_index = 0; supply_index < corner.supplies.length; ++supply_index )
	                    if( corner.supplies[ supply_index ].type == type ) 
	                        this.traveseGraph( type, corner.supplies[ supply_index ].owner, { x: x, y: y }, true );
	            }


	    //Clean up after ourselves by removing the extra keys
	    for (var i = 0; i < 2; ++i) {
	        var height = board_height + (i == 0 ? 1 : 0);
	        for (var y = 0; y < height; ++y) {
	            var width = board_width + (i == 0 ? 0 : 1);
	            for (var x = 0; x < width; ++x) {
	                var edge = this.edges[i][y][x];
	                delete edge.consumed;
	            }
	        }
	    }

	    var bonus_cards = 0;

	    for( var player_index = 0; player_index < this.players.length; ++player_index )
	        this.players[ player_index ].points = 0;        

	    //update cells
	    for (var y = 0; y < board_height; ++y) {
	        for (var x = 0; x < board_width; ++x) {
	            var cell = this.cells[y][x];

	            edge_coords = getAdjacentEdgesToCell({ x: x, y: y });
	            var already_supplied_by = cell.supplied[ utility_type_road ];
	            if (already_supplied_by !== null && !edge_coords.some(function (edge_coord) {
	                var edge = self.edges[edge_coord.direction][edge_coord.y][edge_coord.x];
	                return edge.type === utility_type_road && edge.player === already_supplied_by;
	            })) {
	                cell.supplied[utility_type_road] = null;
	            }

	            if (cell.supplied[utility_type_road] == null) {
	                edge_coords.forEach(function (edge_coord) {
	                    var edge = self.edges[edge_coord.direction][edge_coord.y][edge_coord.x];
	                    if (edge.player !==  null && edge.type === utility_type_road )
	                        cell.supplied[utility_type_road] = edge.player;
	                });
	            }

	            for (var type = 2; type < 5; ++type) {

	                //If we are already supplied by someone, but that someone doesn't have any supplies nearby anymore
	                //Then nullify the supply
	                corner_coords = getAdjacentCornersToCell({ x: x, y: y });
	                var already_supplied_by = cell.supplied[type];
	                if ( already_supplied_by !== null && !corner_coords.some(function (corner_coord) {
	                    var corner = self.corners[corner_coord.y][corner_coord.x];
	                    return corner.supplies.some(function (s) { return s.owner === already_supplied_by && s.type === type; });
	                })) {
	                    cell.supplied[type] = null;
	                }

	                if (cell.supplied[type] == null) {
	                    corner_coords.forEach(function (corner_coord) {
	                        var corner = self.corners[corner_coord.y][corner_coord.x];
	                        var found_supply = find_if(corner.supplies, function (s) { return s.type == type; });
	                        if (found_supply !== undefined)
	                            cell.supplied[type] = found_supply.owner;
	                    });
	                }
	            }
	            
	            for (var level = 0; level + 1 < cell.supplied.length && cell.supplied[level + 1] !== null; ++level) {
	                this.players[cell.supplied[ level + 1 ]].points += supply_points[ level + 1 ];
	            }

	            cell.level = level;
	            if (cell.level > cell.max_level) {
	                bonus_cards += cell.level - cell.max_level;
	                cell.max_level = cell.level;
	            }
	        }
	    }

	    for( var i = 0; i < bonus_cards; ++i )
	        this.players[ this.last_player_index ].giveBonusCard();
	}

	game.prototype.nextPlayerTurn = function() {
	    this.players[ this.last_player_index ].onEndTurn();
	    ++this.last_player_index;
	    if (this.last_player_index == this.players.length)
	        this.last_player_index = 0;
	    this.players[ this.last_player_index ].onStartTurn();


	    for( var y = 0; y < board_height; ++y )
	        for( var x = 0; x < board_width; ++x ) {
	            var cell = this.cells[ y ][ x ];
	            if( cell.generator && cell.level == 4 && cell.supplied[ utility_type_internet ] === this.last_player_index )
	                this.players[ this.last_player_index ].cards.push( utility_type_any );
	        }
	}


	game.prototype.canBuildElement = function( edge_coord, player_index, element_type ) {
	    var self = this;
	    //Not blocked already by another edge
	    var edge = this.edges[edge_coord.direction][edge_coord.y][edge_coord.x];
	    if ( edge.type )
	        return false;

	    //Check that the player has a card of the right type
	    if( !this.players[ player_index ].hasCardOfType( element_type ) )
	        return false;
	   
	    //Check that the player has supply on an adjacent corner  
	    var found_supply = getAdjacentCornersToEdge( edge_coord ).some( function ( corner_coord ) {
	        var corner = self.corners[corner_coord.y][corner_coord.x];
	        return corner.supplies.some(function (s) { 
	            return s.type == element_type && s.owner == player_index;
	        }) || ( !self.players[ player_index ].has_claimed_road_source && element_type == utility_type_road && corner.source && corner.source.type == utility_type_road && corner.source.owner === null );
	    });

	    if (!found_supply)
	        return false;

	    return true;
	}

	game.prototype.canDestroyElement = function( edge_coord, player_index ) {
	    var edge = this.edges[edge_coord.direction][edge_coord.y][edge_coord.x];
	    if ( !edge.type || edge.type == utility_type_destroyed )
	        return false;

	    //Check that the player has a card of the right type
	    if( !this.players[ player_index ].hasCardOfType( edge.type ) )
	        return false;
	   
	    var self = this;
	    //Check that the player has road on an adjacent corner  
	    var found_supply = getAdjacentCornersToEdge( edge_coord ).some( function ( corner_coord ) {
	        var corner = self.corners[corner_coord.y][corner_coord.x];
	        return corner.supplies.some(function (s) { return s.owner == player_index && s.type == utility_type_road; });
	    });

	    if (!found_supply)
	        return false;

	    return true;    
	}

	game.prototype.buildElement = function(edge_coord, player_index, element_type) {

	    if( !this.canBuildElement( edge_coord, player_index, element_type ) )
	        return false;

	    var edge = this.edges[edge_coord.direction][edge_coord.y][edge_coord.x];

	    edge.type = element_type;
	    edge.player = player_index;

	    this.players[ player_index ].removeCardOfType( element_type );

	    var self = this;
	    //Special case when placing roads
	    //Claim any unclaimed road sources
	    if( element_type == utility_type_road ) {
	        var found_source = find_if( getAdjacentCornersToEdge( edge_coord ), function( corner_coord ) { 
	            var corner = self.corners[ corner_coord.y ][ corner_coord.x ];
	            return corner.source && corner.source.type === utility_type_road && corner.source.owner === null;
	        } );
	        if( found_source !== undefined ) {
	            self.corners[ found_source.y ][ found_source.x ].source.owner = player_index;
	            self.players[ player_index ].has_claimed_road_source = true;
	        }
	    }

	    this.propogateOwnership();
	    return true;
	}

	game.prototype.destroyElement = function( edge_coord, player_index ) {
	    if( !this.canDestroyElement( edge_coord, player_index ) )
	        return false;

	    var edge = this.edges[edge_coord.direction][edge_coord.y][edge_coord.x];

	    var edge_type = edge.type;
	    edge.type = utility_type_destroyed;
	    edge.player = null;

	    this.players[ player_index ].removeCardOfType( edge_type );
	    this.propogateOwnership();
	    return true;
	}


	//Shared functions

	function find_if( array, f ) {
	    for( var i = 0; i < array.length; ++i )
	        if( f( array[ i ] ) )
	            return array[ i ];
	    return undefined;
	}

	function randomUtility( ) {
	    return Math.floor( Math.random() * 4 ) + 1;
	}

	function forEachAjacentEdgeToCorner( corner_coord, f ) {
	    if (corner_coord.x > 0)
	        f({ direction: direction_horizontal, x: corner_coord.x - 1, y: corner_coord.y });
	    if (corner_coord.x < board_width)
	        f({ direction: direction_horizontal, x: corner_coord.x, y: corner_coord.y });
	    if (corner_coord.y > 0)
	        f({ direction: direction_vertical, x: corner_coord.x, y: corner_coord.y - 1 });
	    if (corner_coord.y < board_height)
	        f({ direction: direction_vertical, x: corner_coord.x, y: corner_coord.y });
	}

	function getOppositeCornerAlongEdge(corner_coord, edge_coord) {
	    if (edge_coord.x == corner_coord.x && edge_coord.y == corner_coord.y) {
	        if (edge_coord.direction == direction_horizontal)
	            return { x: edge_coord.x + 1, y: edge_coord.y };
	        else
	            return { x: edge_coord.x, y: edge_coord.y + 1 };
	    }
	    else
	        return { x: edge_coord.x, y: edge_coord.y };
	}

	function getAdjacentCornersToCell(cell_coords) {
	    var corners = [];
	    corners.push({ x: cell_coords.x, y: cell_coords.y });
	    corners.push({ x: cell_coords.x + 1, y: cell_coords.y });
	    corners.push({ x: cell_coords.x, y: cell_coords.y + 1 });
	    corners.push({ x: cell_coords.x + 1, y: cell_coords.y + 1 });
	    return corners;
	}

	function getAdjacentEdgesToCell(cell_coords) {
	    var edges = [];
	    edges.push({ direction: direction_horizontal, x: cell_coords.x, y: cell_coords.y });
	    edges.push({ direction: direction_horizontal, x: cell_coords.x, y: cell_coords.y + 1 });
	    edges.push({ direction: direction_vertical, x: cell_coords.x + 1, y: cell_coords.y });
	    edges.push({ direction: direction_vertical, x: cell_coords.x, y: cell_coords.y });
	    return edges;
	}

	function getAdjacentCornersToEdge(edge_coord) {

	    if (edge_coord.direction === direction_horizontal)
	        return [{ x: edge_coord.x, y: edge_coord.y }, { x: edge_coord.x + 1, y: edge_coord.y }];
	    else
	        return [{ x: edge_coord.x, y: edge_coord.y }, { x: edge_coord.x, y: edge_coord.y + 1 }];
	}

	game.prototype.serialise = function () {
		var data = {};
		data.cells = this.cells;
		data.edges = this.edges;
		data.corners = this.corners;
		data.players = this.players;
		data.last_player_index = this.last_player_index;
		return data;
	}

	function ClientGame() {
		this.cells = initCells();
		this.edges = initEdges();
		this.players = initPlayers();
		this.corners = initCorners();
		this.last_player_index = 0;
		this.started = false;
	}
	ClientGame.prototype.canBuildElement = game.prototype.canBuildElement;
	ClientGame.prototype.canDestroyElement = game.prototype.canDestroyElement;

	ClientGame.prototype.getConnectionData = function ( x, y, type, owner) {
		var adjacentEdges = [];
    	adjacentEdges.push(this.getEdgeConnectionData(direction_horizontal, x - 1, y, type, owner));
    	adjacentEdges.push(this.getEdgeConnectionData(direction_horizontal, x, y, type, owner));
    	adjacentEdges.push(this.getEdgeConnectionData(direction_vertical, x, y - 1, type, owner));
    	adjacentEdges.push(this.getEdgeConnectionData(direction_vertical, x, y, type, owner ));
	    return adjacentEdges.join("");
	}

	ClientGame.prototype.getEdgeConnectionData = function (dir, x, y, type, owner) {
		if (x < 0 || y < 0 || x > board_width || y > board_height)
			return " ";
		if (dir === direction_horizontal && x === board_width)
			return " ";
		if (dir === direction_vertical && y === board_height)
			return " ";

		var edge_coord = { direction: dir, x: x, y: y };
		var edge = this.edges[dir][y][x];
		if (edge.type === type && edge.owner === owner)
			return "1";
		return " ";
	}


	ClientGame.prototype.updateData = function (data) {
		this.started = true; //only needed on first update
		this.cells = data.cells;
		this.edges = data.edges;
		this.corners = data.corners;
		this.last_player_index = data.last_player_index;

		for (var i = 0; i < this.players.length; i++) {
			this.players[i].updateData(data.players[i]);
		}
	}

	exports.ClientGame = ClientGame;
	exports.game = game;
	exports.find_if = find_if;
	console.log("Shared code added");

})(typeof exports === 'undefined'? this : exports);