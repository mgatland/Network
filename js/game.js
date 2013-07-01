//Shared globals
var element_type_edge = 1;
var element_type_corner = 2;
var element_type_cell = 3;

var direction_horizontal = 0;
var direction_vertical = 1;

var utility_type_any = 0;
var utility_type_road = 1;
var utility_type_water = 2;
var utility_type_electricity = 3;
var utility_type_internet = 4;
var utility_type_destroyed = 5;

var board_width = 6;
var board_height = 6;

var supply_points = [null, 0, 1, 2, 4];


//Shared classes


function game( ) {
    var self = this;
    this.players = [ new player(), new player()];


    this.last_player_index = 0;

    //Init edges
    this.edges = [[],[]];
    for (var i = 0; i < 2; ++i) {
        var height = board_height + (i == 0 ? 1 : 0);
        this.edges[i] = new Array(height);
        for (var y = 0; y < height; ++y) {
            var width = board_width + (i == 0 ? 0 : 1);
            this.edges[i][y] = new Array(width);
            for (var x = 0; x < width; ++x) {
                this.edges[i][y][x] = new edge();
            }
        }
    }

    //Init corners
    this.corners = new Array(board_height + 1);
    for (var y = 0; y < board_height + 1; ++y) {
        this.corners[y] = new Array(board_width + 1);
        for (var x = 0; x < board_width + 1; ++x) {
            this.corners[y][x] = new corner();
        }
    }

    //Init cells
    this.cells = new Array(board_height);
    for( var y = 0; y < board_height; ++y ) {
        this.cells[y] = new Array(board_width);
        for (var x = 0; x < board_width; ++x)
            this.cells[y][x] = new cell();
    }

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
                        var found_supply = corner.supplies.find_if(function (s) { return s.type == type; });
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
        var found_source = getAdjacentCornersToEdge( edge_coord ).find_if( function( corner_coord ) { 
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



function player() {
    this.points = 0;
    this.cards = [ utility_type_road, utility_type_road, utility_type_road ];
    this.next_turn_bonus_cards = [];
    this.has_claimed_road_source = false;
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


//Shared functions

Array.prototype.find_if = function (f) {
    for( var i = 0; i < this.length; ++i )
        if( f( this[ i ] ) )
            return this[ i ];
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

//Clent globals
var width = 750;
var height = 750;

var border = 20;

var cell_width = (width - border * 2) / board_width;

var utility_letter = ['?', 'R', 'W', 'E', 'I'];
var player_colours = ['blue', 'green'];
var utility_type_dashes = [null, null, [1], [10, 5], [5, 5], [2]];


var ctx;

var global_game;

//Client classes


//Client functions


function startGame() {

    global_game = new game();

    var canvas = document.getElementById('game');
    ctx = canvas.getContext("2d");
    
    ctx.font = '17px Calibri';

    canvas.onclick = onClick;
    document.getElementById("build_menu_form").addEventListener('click', buildButton);

    document.getElementById("end_turn_button").addEventListener( 'click', endTurnButton );

    drawBoard(global_game, ctx);
    updateStatus( global_game );
}

function endTurnButton( e ) {
    global_game.nextPlayerTurn();
    updateStatus( global_game );
    drawBoard( global_game, ctx );
}

function drawline(ctx, x1, y1, x2, y2, colour, width, dash ) {
    ctx.beginPath();
    ctx.setLineDash(dash);
    //ctx.mozDash([5, 10]);
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.moveTo( x1, y1);
    ctx.lineTo( x2,y2 );
    ctx.stroke();
}

function drawHighlight( ctx, edge_coord ) {
    var colour = 'rgb( 210, 255, 255 )';
    var dash = null;
    var line_width = 20;
    if (edge_coord.direction == direction_vertical) {
        var xp = border + edge_coord.x * cell_width;
        drawline(ctx
            , xp, border + edge_coord.y * cell_width
            , xp, border + (edge_coord.y + 1) * cell_width
            , colour, line_width, dash );
    }
    else {
        var yp = border + edge_coord.y * cell_width
        drawline(ctx
            , border + edge_coord.x * cell_width, yp
            , border + (edge_coord.x + 1) * cell_width , yp
            , colour, line_width, dash );
    }
}

function drawEdge(ctx, edge_coord, edge ) {

    if (edge.type === null)
        return;

    var corner_border = 5;

    if ( edge.type === utility_type_destroyed )
        var colour = 'red';
    else if (edge.player === null)
        var colour = 'grey';
    else
        var colour = player_colours[edge.player];
    
    var dash = utility_type_dashes[edge.type];

    var line_width = 3;

    if (edge_coord.direction == direction_vertical) {
        var xp = border + edge_coord.x * cell_width;
        drawline(ctx
            , xp, border + edge_coord.y * cell_width + corner_border
            , xp, border + (edge_coord.y + 1) * cell_width - corner_border
            , colour, line_width, dash );
    }
    else {
        var yp = border + edge_coord.y * cell_width
        drawline(ctx
            , border + edge_coord.x * cell_width + corner_border, yp
            , border + (edge_coord.x + 1) * cell_width - corner_border, yp
            , colour, line_width, dash );
    }

  
}

function drawBoard(game, ctx) {
    ctx.fillStyle = "rgb( 255, 255, 255 )";
    ctx.fillRect(0, 0, width, height);

    for (var y = 0; y < board_height; ++y)
        for (var x = 0; x < board_width; ++x) {
            var cell = game.cells[y][x];
            if( !cell.generator )
                continue;
            ctx.fillStyle = "rgb( 255, 255, 200 )";
            ctx.fillRect( border + x * cell_width, border + y * cell_width, cell_width, cell_width );
        }

    //Draw "can move" highlights
    for (var i = 0; i < 2; ++i) {
        var column_height = board_height + (i == 0 ? 1 : 0);
        for (var y = 0; y < column_height; ++y) {
            var row_width = board_width + (i == 0 ? 0 : 1);
            for (var x = 0; x < row_width; ++x) {
                var edge = game.edges[i][y][x];

                var edge_coord = { direction: i, x: x, y: y };
                var can_build_here = false;
                for( var type = 1; type <= 4; ++type )
                    if( game.canBuildElement( edge_coord, game.last_player_index, type ) ) {
                        can_build_here = true;
                        break;
                    }
                if( game.canDestroyElement( edge_coord, game.last_player_index ))
                    can_build_here = true;

                if( can_build_here )
                    drawHighlight( ctx, edge_coord )
            }
        }
    }

    ctx.fillStyle = "rgb(0,0,0)";
    for( var y = 0; y <= board_height; ++y )
    {
        var yp = y * cell_width + border;
        ctx.fillRect(border, yp, board_width * cell_width, 1);
    }
    for (var x = 0; x <= board_width; ++x) {
        var xp = x * cell_width + border;
        ctx.fillRect(xp, border, 1, board_height * cell_width);
    }


    //Draw edges
    for (var i = 0; i < 2; ++i) {
        var column_height = board_height + (i == 0 ? 1 : 0);
        for (var y = 0; y < column_height; ++y) {
            var row_width = board_width + (i == 0 ? 0 : 1);
            for (var x = 0; x < row_width; ++x) {
                var edge = game.edges[i][y][x];
                drawEdge(ctx, { direction: i, x: x, y: y }, edge );
            }
        }
    }

    //Draw sources

    for (var y = 0; y < board_height + 1; ++y) {
        for (var x = 0; x < board_width + 1; ++x) {
            var corner = game.corners[y][x];
            if (corner.source === null)
                continue;

            if (corner.source.owner === null)
                ctx.fillStyle = 'black';
            else
                ctx.fillStyle = player_colours[corner.source.owner];

            ctx.fillText(utility_letter[ corner.source.type ], border + cell_width * x - 17, border + cell_width * y - 5);
        }
    }

    //Draw cells

    for (var y = 0; y < board_height; ++y) {
        for (var x = 0; x < board_width; ++x) {
            var cell = game.cells[y][x];

            if (cell.level > 1) {
                ctx.fillStyle = 'black';
                ctx.fillText( '' + (cell.level -1), border + cell_width * x + cell_width / 2 - 5, border + cell_width * y + cell_width / 2 - 20 );
            }
            
            for (var type = 1; type < 5; ++type) {
                if (cell.supplied[type] === null)
                    continue;

                ctx.fillStyle = player_colours[cell.supplied[type]];
                ctx.fillText(utility_letter[type], border + cell_width * x + 5 + type * 10, border + cell_width * y + cell_width / 2 + 5);
            }
        }
    }
   
}



function relMouseCoords(currentElement, event) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;

    do {
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while (currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return { x: canvasX, y: canvasY }
}

function mouseToElement(coords) {

    //First check for corners

    var corner_pos_x = (coords.x - border + cell_width / 2) / cell_width;
    var corner_pos_y = (coords.y - border + cell_width / 2) / cell_width;
    var corner_x = Math.floor( corner_pos_x );
    var corner_y = Math.floor(corner_pos_y);

    if ( Math.abs( corner_pos_x - corner_x - 0.5 ) < 0.1 && Math.abs( corner_pos_y - corner_y - 0.5 ) < 0.1)
        return { type: element_type_corner, x: corner_x, y: corner_y };
    
    var cell_pos_x = (coords.x - border) / cell_width;
    var cell_pos_y = (coords.y - border) / cell_width;
    var cell_x = Math.floor(cell_pos_x);
    var cell_y = Math.floor(cell_pos_y);


    //Vertical lines

    if (Math.abs(corner_pos_x - corner_x - 0.5) < 0.1)
        return { type: element_type_edge, direction: direction_vertical, x: corner_x, y: cell_y };

    //Horizontal lines
    if (Math.abs(corner_pos_y - corner_y - 0.5) < 0.1)
        return { type: element_type_edge, direction: direction_horizontal, x: cell_x, y: corner_y };

    //Cells

    return { type: element_type_cell, x: cell_x, y: cell_y };
}



function updateStatus( game ) {

    var status_text = '';

    for( var player_index = 0; player_index < game.players.length; ++player_index ) {
        status_text += "Player " +( player_index + 1) + ": " + game.players[ player_index ].points + " ";
    }

    status_text += '<br>Player ' + ( game.last_player_index + 1 ) + ' turn'

    document.getElementById("status").innerHTML = status_text;

    var card_text = 'Current cards: <span class="active_cards">';
    var current_cards =  game.players[ game.last_player_index ].cards;
    for( var card_index = 0; card_index < current_cards.length; ++card_index ) {
        card_text += utility_letter[ current_cards[ card_index ]] + " ";
    }
    card_text += '</span><span class="bonus_cards">'
    var next_turn_cards = game.players[ game.last_player_index ].next_turn_bonus_cards;
    for( var card_index = 0; card_index <  next_turn_cards.length; ++card_index )
        card_text += utility_letter[ next_turn_cards[ card_index ]] + " ";
    document.getElementById("cards").innerHTML = card_text;
}


var build_edge_coord = null;

function buildButton(e) {
    if (e.target.type != "button")
        return;

    if (build_edge_coord === null)
        return;

    var utility_type = parseInt(e.target.name, 10);
    if( utility_type === 0 )
        global_game.destroyElement( build_edge_coord, global_game.last_player_index );
    else
        global_game.buildElement(build_edge_coord, global_game.last_player_index, utility_type );

    var menu_box = document.getElementById("build_menu");
    menu_box.style.display = "none";

    drawBoard(global_game, ctx);
    updateStatus( global_game );
}


function show_build_menu(edge_coord, e, player_index ) {
    build_edge_coord = edge_coord;

    var menu_box = document.getElementById("build_menu");

    for (var type = 1; type < 5; ++type) {
        var can_build = global_game.canBuildElement( edge_coord, player_index, type );
        document.getElementById( "build" + type ).style.display = ( can_build ? 'block' : 'none' );
    }

    var can_destroy = global_game.canDestroyElement( edge_coord, player_index );
    document.getElementById( "build0" ).style.display = ( can_destroy ? 'block' : 'none' );

    menu_box.style.display = "block";
    menu_box.style.top = ( e.pageY - menu_box.clientHeight - 10 ) + "px";
    menu_box.style.left = ( e.pageX - menu_box.clientWidth / 2 ) + "px";
}

function onClick(e) {
    var coords = relMouseCoords(this, e);
    
    var selected_element = mouseToElement(coords);

    if (selected_element && selected_element.type == element_type_edge) {
        show_build_menu(selected_element, e, global_game.last_player_index );
    }

    if (selected_element && selected_element.type == element_type_corner) {
        console.log(global_game.corners[selected_element.y][selected_element.x]);
    }

    if (selected_element && selected_element.type == element_type_cell) {
        console.log(global_game.cells[selected_element.y][selected_element.x]);
    }

}
