//Clent globals

var localPlayers = [];

var width = 450;
var height = 450;

var border = 20;

var utility_letter = ['?', 'R', 'W', 'E', 'I'];
var player_colours = ['blue', 'green'];
var utility_type_dashes = [null, null, [1], [10, 5], [5, 5], [2]];

var textColour = 'black';
var lightTextColour = 'white';

var cardWidth = 64;
var cardHeight = 64;  
var gapBetweenCards = 16;

var ctx;

var global_game;

var cardsImg = loadImage("/js/cards.png");

//connection data

var port = 80;

function loadImage(name)
{
    var image = new Image();
    image.src = name;
    return image;
}

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

    socket.on('message', function (msg) {
        document.getElementById('serverMessages').innerHTML = msg; //TODO: security
    });

    socket.on('localPlayers', function (players) {
        localPlayers = players;
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

function startGame() {

    connect();

    global_game = new ClientGame();

    var networkOptionsForm = document.getElementById('network_options_form');

    document.getElementById('localMultiplayerButton').addEventListener('click', function () {
        socket.emit('startLocalGame');
        networkOptionsForm.style.display = "none";

    });

    document.getElementById('networkMultiplayerButton').addEventListener('click', function () {
        socket.emit('startNetworkGame');
        networkOptionsForm.style.display = "none";
    });

}

function resize(canvas) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    width = canvas.width;
    height = canvas.height;
    drawBoard(global_game, ctx); 
    updateStatus( global_game); 
}

function startGame2d( game ) {
    var canvas = document.getElementById('game');
    ctx = canvas.getContext("2d");
    
    ctx.font = '17px Calibri';

    canvas.onclick = onClick;
    document.getElementById("build_menu_form").addEventListener('click', buildButton);

    document.getElementById("end_turn_button").addEventListener( 'click', endTurnButton );

    window.addEventListener('resize', function () {
        resize(canvas);
    });

    resize(canvas);
    updateStatus( global_game );  
}

function endTurnButton( e ) {

    var menu_box = document.getElementById("build_menu");
    menu_box.style.display = "none";

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
    var line_width = 2;

    var start = game_display_3d.gridCoordToPixel(edge_coord.x, edge_coord.y);

    if (edge_coord.direction == direction_vertical) {
        var end = game_display_3d.gridCoordToPixel(edge_coord.x, edge_coord.y + 1);
    }
    else {
        var end = game_display_3d.gridCoordToPixel(edge_coord.x + 1, edge_coord.y);
    }
    drawline(ctx , start[0], start[1], end[0], end[1], colour, line_width, dash );
}

function drawEdge(ctx, edge_coord, edge ) {

    if (edge.type === null)
        return;

    var corner_border = 0.1;

    if ( edge.type === utility_type_destroyed )
        var colour = 'red';
    else if (edge.player === null)
        var colour = 'grey';
    else
        var colour = player_colours[edge.player];
    
    var dash = utility_type_dashes[edge.type];

    var line_width = 3;

    if (edge_coord.direction == direction_vertical) {
        var start = game_display_3d.gridCoordToPixel(edge_coord.x, edge_coord.y + corner_border);
        var end = game_display_3d.gridCoordToPixel(edge_coord.x, edge_coord.y + 1 - corner_border);
    }
    else {
        var start = game_display_3d.gridCoordToPixel(edge_coord.x + corner_border, edge_coord.y);
        var end = game_display_3d.gridCoordToPixel(edge_coord.x + 1 - corner_border, edge_coord.y);
    }
    drawline(ctx , start[0], start[1], end[0], end[1], colour, line_width, dash );
}

function drawBoard(game, ctx) {
    ctx.clearRect (0, 0, width, height);
    ctx.font = '17px Calibri';

    //TODO: draw generators
    /*for (var y = 0; y < board_height; ++y)
        for (var x = 0; x < board_width; ++x) {
            var cell = game.cells[y][x];
            if( !cell.generator )
                continue;
            ctx.fillStyle = "rgb( 255, 255, 200)";
        }*/

    if (window.game_display_3d) {
        var t1 = window.game_display_3d.gridCoordToPixel(0, 0);
        var t2 = window.game_display_3d.gridCoordToPixel(1, 1);
        var cell_width = Math.abs(t1[1] - t2[1]);
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
                ctx.fillStyle = textColour;
            else
                ctx.fillStyle = player_colours[corner.source.owner];

            var pos = game_display_3d.gridCoordToPixel(x, y);
            ctx.fillText(utility_letter[ corner.source.type ], pos[0] - 3, pos[1] - 10);
        }
    }

    //Draw cells
    for (var y = 0; y < board_height; ++y) {
        for (var x = 0; x < board_width; ++x) {
            var cell = game.cells[y][x];

            if (cell.level > 1) {
                ctx.fillStyle = textColour;
                var pos = game_display_3d.gridCoordToPixel(x, y);
                ctx.fillText( '' + (cell.level -1), pos[0], pos[1] - cell_width * 0.6);
            }
            
            for (var type = 1; type < 5; ++type) {
                if (cell.supplied[type] === null) {
                    continue;
                }
                var pos = game_display_3d.gridCoordToPixel(x, y);
                ctx.fillStyle = player_colours[cell.supplied[type]];
                var offset = (type - 1) * cell_width * 0.2;
                ctx.fillText(utility_letter[type], pos[0] - cell_width * 0.3 + offset, pos[1] - cell_width * 0.5);
            }
        }
    }

    drawPlayerHUD(game, ctx);
}

function drawPlayerHUD(game, ctx) {

    if (localPlayers.length === 1) {
        var currentPlayer = localPlayers[0];
    } else {
        currentPlayer = game.last_player_index;
    }

    // current player's cards
    var cardStartX = 32;
    var cardStartY = height - cardHeight - 32;
    var offset = cardWidth + gapBetweenCards;

    var current_cards =  game.players[ currentPlayer ].cards;
    drawCards(ctx, cardStartX, cardStartY, current_cards, offset);

    var next_turn_cards = game.players[ currentPlayer ].next_turn_bonus_cards;
    cardStartX = width - cardWidth - gapBetweenCards;
    drawCards(ctx, cardStartX, cardStartY, next_turn_cards, -offset);

    if (next_turn_cards && next_turn_cards.length > 0) {
        ctx.fillStyle = lightTextColour;
        ctx.fillText("Next turn:", cardStartX, cardStartY - 30);
    }

    //other player's cards:
    cardStartX = width - cardWidth - gapBetweenCards;
    cardStartY = gapBetweenCards;

    var otherPlayer = getOtherPlayer(currentPlayer);
    var otherPlayerCards =  toHiddenCards(game.players[ otherPlayer ].cards);
    //hide the values of the other player's cards
    drawCards(ctx, cardStartX, cardStartY, otherPlayerCards, -offset);

    //draw points
    ctx.fillStyle = lightTextColour;
    ctx.fillText("Points: " + game.players[ currentPlayer ].points, 32, height - cardHeight - 64);
    ctx.fillText("Points: " + game.players[ otherPlayer ].points, width - 100, 0 + cardHeight + 64);
}

function getOtherPlayer(currentPlayer) {
    return (currentPlayer === 0 ? 1 : 0);
}

function toHiddenCards(cards) {
    return Array.apply(null, new Array(cards.length)).map(Number.prototype.valueOf,4); //actually shows Internet card
}

function drawCards(ctx, startX, startY, cards, offset) {
    if (!cards || cards.length == 0) 
        return;
    for( var card_index = 0; card_index < cards.length; ++card_index ) {
        var cardType = cards[ card_index ];
        var cardSrcX = cardWidth * cardType;
        ctx.drawImage(cardsImg, 
            cardSrcX, 0,
            cardWidth, cardHeight,
            startX + card_index * offset, startY,
            cardWidth, cardHeight);
    }
}

function show(id) {
    document.getElementById(id).style.display = null;
}

function hide(id) {
    document.getElementById(id).style.display = "none";
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

    var corner_pos_x = coords.x + 0.5;
    var corner_pos_y = coords.y + 0.5;
    var corner_x = Math.floor( corner_pos_x );
    var corner_y = Math.floor(corner_pos_y);

    if ( Math.abs( corner_pos_x - corner_x - 0.5 ) < 0.1 && Math.abs( corner_pos_y - corner_y - 0.5 ) < 0.1)
        return { type: element_type_corner, x: corner_x, y: corner_y };
    
    var cell_pos_x = coords.x;
    var cell_pos_y = coords.y;
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

function isMyTurn ( game ) {
    return localPlayers.indexOf(game.last_player_index) >= 0;
}

function updateStatus( game ) {

    var status_text = '';

    if (!game.started) return;

    if (isMyTurn( game )) {
        if (localPlayers.length == 1) {
            status_text = 'Your turn'
        } else {
            status_text = 'Player ' + ( game.last_player_index + 1 ) + ' turn'
        }
        var endTurnForm = document.getElementById('end_turn_form');
        endTurnForm.style.display = null;
        endTurnForm.style.left = "32px";
        endTurnForm.style.top = (height - 212) + "px";
    } else {
        status_text += "Other player's turn...";
        document.getElementById("end_turn_form").style.display = "none";
    }

    document.getElementById("status").innerHTML = status_text;
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

    hide("build_menu");
}


function show_build_menu(edge_coord, e, player_index ) {

    if (!isMyTurn( global_game ))
        return;

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
    //actual coords, for overlay var coords = relMouseCoords(this, e);
    
    var coords = game_display_3d.pixelToGridCoord( e.pageX, e.pageY ) 

    var selected_element = mouseToElement( {x: coords[0], y: coords[1] });

    if (selected_element && selected_element.type == element_type_edge) {
        show_build_menu(selected_element, e, global_game.last_player_index );
        return;
    }
    hide("build_menu");

    if (selected_element && selected_element.type == element_type_corner) {
        console.log(global_game.corners[selected_element.y][selected_element.x]);
    }

    if (selected_element && selected_element.type == element_type_cell) {
        console.log(global_game.cells[selected_element.y][selected_element.x]);
    }

}
