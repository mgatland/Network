//Clent globals
var width = 450;
var height = 450;

var border = 20;

var cell_width; //must be initialised after shared file has loaded

var utility_letter = ['?', 'R', 'W', 'E', 'I'];
var player_colours = ['blue', 'green'];
var utility_type_dashes = [null, null, [1], [10, 5], [5, 5], [2]];

var ctx;

var global_game;

var port = 80;

//Client functions
function connect() {
    console.log("connecting to port " + port);
    socket = io.connect("http://" + document.domain + ":" + port);
    socket.on('connect', function () {
        console.log("Connected.");
    });

    socket.on('gamestate', function (data) {
        console.log(data);
        global_game.updateData(data);
        drawBoard(global_game, ctx);
        updateStatus( global_game );
    });

    ClientGame.prototype.buildElement = function(edge_coord, player_index, element_type) {
        socket.emit('buildElement', { edge_coord: edge_coord, player_index: player_index, element_type: element_type});
    }

    ClientGame.prototype.destroyElement = function(edge_coord, player_index) {
        socket.emit('destroyElement', { edge_coord: edge_coord, player_index: player_index});
    }

    ClientGame.prototype.nextPlayerTurn = function() {
        socket.emit('nextPlayerTurn');
    }
}

function startGame2d( game ) {
    var canvas = document.getElementById('game');
    ctx = canvas.getContext("2d");
    
    ctx.font = '17px Calibri';

    canvas.onclick = onClick;
    document.getElementById("build_menu_form").addEventListener('click', buildButton);

    document.getElementById("end_turn_button").addEventListener( 'click', endTurnButton );


    connect();

    cell_width = (width - border * 2) / board_width;

    global_game = new ClientGame();

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
    // wait for server

    // drawBoard(global_game, ctx);
    // updateStatus( global_game );
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
