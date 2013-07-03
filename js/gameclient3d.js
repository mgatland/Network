

function bindBuffer( shader ) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
    this.gl.enableVertexAttribArray(shader.position_attribute);
    this.gl.vertexAttribPointer(shader.position_attribute, 3, this.gl.FLOAT, false, 24, 0);
    this.gl.enableVertexAttribArray(shader.normal_attribute)
    this.gl.vertexAttribPointer(shader.normal_attribute, 3, this.gl.FLOAT, false, 24, 12);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
}

function draw( shader ) {
	//Bind mesh
	this.bindBuffer( shader );

	//World matrix
	this.gl.uniformMatrix4fv( shader.world, false, this.transform );

	//Colour
	this.gl.uniform4fv( shader.colour, this.colour );

	if( shader.team_colour && this.team_colour )
		this.gl.uniform4fv( shader.team_colour, this.team_colour );

	if( shader.team_colour_mask && this.team_colour_mask ) {
		this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.team_colour_mask.texture);
        this.gl.uniform1i(shader.team_colour_mask, 0);
	}

	//and DRAW
	this.gl.drawElements( this.primitive_type, this.num_indices, this.index_type, 0 );
}

function boardModel( gl ) {
	this.gl = gl;

	this.num_indices = 6;
	this.primitive_type = this.gl.TRIANGLES;
	this.index_type = this.gl.UNSIGNED_SHORT;
	this.colour = [ 0.5, 1.0, 0.5, 1.0 ];

	this.transform = mat4.create( );
	mat4.identity( this.transform );

	var vertices = [
		0.0, 0.0, 0.0, 					0.0, 0.0, 1.0,
		board_width, 0.0, 0.0, 			0.0, 0.0, 1.0,
		board_width, board_height, 0.0, 0.0, 0.0, 1.0,
		0.0, board_height, 0.0, 		0.0, 0.0, 1.0
	];

	var indices = [
		0, 1, 2,
		0, 2, 3
	]

	this.vertex_buffer = this.gl.createBuffer();
	this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.vertex_buffer );
	this.gl.bufferData( this.gl.ARRAY_BUFFER, new Float32Array( vertices ), this.gl.STATIC_DRAW );
	this.gl.bindBuffer( this.gl.ARRAY_BUFFER, null );

	this.index_buffer = this.gl.createBuffer();
	this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, this.index_buffer );
	this.gl.bufferData( this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), this.gl.STATIC_DRAW );
	this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, null );
}

boardModel.prototype.bindBuffer = bindBuffer;
boardModel.prototype.draw = draw;

function gridLineModel( gl ) {
	this.gl = gl;

	this.num_indices = ( ( board_height + 1 ) + ( board_width +1 ) ) * 2;
	this.primitive_type = this.gl.LINES;
	this.index_type = this.gl.UNSIGNED_SHORT;
	this.colour = [ 0.0, 0.0, 0.0, 1.0 ];

	this.transform = mat4.create( );
	mat4.identity( this.transform );



	var vertices = [ ];
	for( var x = 0; x <= board_width; ++x ) {
		vertices.push( x ); vertices.push( 0 ); vertices.push( 0 );
		vertices.push( 0 ); vertices.push( 0 ); vertices.push( 1 );

		vertices.push( x ); vertices.push( board_height ); vertices.push( 0 );
		vertices.push( 0 ); vertices.push( 0 ); vertices.push( 1 );
	}

	for( var y = 0; y <= board_height; ++y ) {
		vertices.push( 0 ); vertices.push( y ); vertices.push( 0 );
		vertices.push( 0 ); vertices.push( 0 ); vertices.push( 1 );

		vertices.push( board_width ); vertices.push( y ); vertices.push( 0 );
		vertices.push( 0 ); vertices.push( 0 ); vertices.push( 1 );
	}


	var indices = []
	for( var i = 0; i < this.num_indices; ++i )
		indices.push( i );

	this.vertex_buffer = this.gl.createBuffer();
	this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.vertex_buffer );
	this.gl.bufferData( this.gl.ARRAY_BUFFER, new Float32Array( vertices ), this.gl.STATIC_DRAW );
	this.gl.bindBuffer( this.gl.ARRAY_BUFFER, null );

	this.index_buffer = this.gl.createBuffer();
	this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, this.index_buffer );
	this.gl.bufferData( this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), this.gl.STATIC_DRAW );
	this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, null );
}

gridLineModel.prototype.bindBuffer = bindBuffer;
gridLineModel.prototype.draw = draw;


function houseModel( gl, height ) {
	this.gl = gl;


	this.primitive_type = this.gl.TRIANGLES;
	this.index_type = this.gl.UNSIGNED_SHORT;
	this.colour = [ 0.8, 0.8, 0.8, 1.0 ];

	this.transform = mat4.create( );
	mat4.identity( this.transform );

	var width_scale = Math.random( ) * 0.05 + 0.04;
	var height_scale = height * ( Math.random() * 0.5 + 0.75 );

	var vertices = [
		-width_scale, -width_scale, 0.0,			0.0, -1.0, 0.0,
		width_scale, -width_scale, 0.0,				0.0, -1.0, 0.0,
		-width_scale, -width_scale, height_scale,	0.0, -1.0, 0.0,
		width_scale, -width_scale, height_scale,	0.0, -1.0, 0.0,

		width_scale, -width_scale, 0.0,				1.0, 0.0, 0.0,
		width_scale, width_scale, 0.0,				1.0, 0.0, 0.0,
		width_scale, -width_scale, height_scale,	1.0, 0.0, 0.0,
		width_scale, width_scale, height_scale,		1.0, 0.0, 0.0,

		width_scale, width_scale, 0.0,				0.0, 1.0, 0.0,
		-width_scale, width_scale, 0.0,				0.0, 1.0, 0.0,
		width_scale, width_scale, height_scale,		0.0, 1.0, 0.0,
		-width_scale, width_scale, height_scale,	0.0, 1.0, 0.0,

		-width_scale, width_scale, 0.0,				-1.0, 0.0, 0.0,
		-width_scale, -width_scale, 0.0,			-1.0, 0.0, 0.0,
		-width_scale, width_scale, height_scale,	-1.0, 0.0, 0.0,
		-width_scale, -width_scale, height_scale,	-1.0, 0.0, 0.0,

		-width_scale, -width_scale, height_scale,	0.0, 0.0, 1.0,
		width_scale, -width_scale, height_scale,	0.0, 0.0, 1.0,
		-width_scale, width_scale, height_scale,	0.0, 0.0, 1.0,
		width_scale, width_scale, height_scale,		0.0, 0.0, 1.0,
	];

	var indices = [
		0, 1, 2,
		2, 1 ,3,
	];

	for( var side = 1; side < 5; ++side )
		for( var i = 0; i < 6; ++i )
			indices.push( indices[ i ] + 4 * side );

	this.num_indices = indices.length;


	this.vertex_buffer = this.gl.createBuffer();
	this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.vertex_buffer );
	this.gl.bufferData( this.gl.ARRAY_BUFFER, new Float32Array( vertices ), this.gl.STATIC_DRAW );
	this.gl.bindBuffer( this.gl.ARRAY_BUFFER, null );

	this.index_buffer = this.gl.createBuffer();
	this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, this.index_buffer );
	this.gl.bufferData( this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), this.gl.STATIC_DRAW );
	this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, null );
}

houseModel.prototype.bindBuffer = bindBuffer;
houseModel.prototype.draw = draw;

function cellDisplay( game, house_models, x, y ) {
	this.house_models = house_models;
	this.game = game;
	this.level = 0;
	this.x = x;
	this.y = y;

	this.previous_houses_sink = null;
	this.previous_houses = null;
	this.current_houses = [];
	this.current_houses_raise = null;

	this.setToLevel( this.game.cells[ y ][ x ].level );
}

cellDisplay.prototype.setToLevel = function( level ) {
	this.level = level;

	this.previous_houses = this.current_houses;
	this.previous_houses_sink = 0.0;
	this.current_houses = [];
	if( this.level < 2 )
		return;

	var spawn_chance = [ 0.5, 0.8, 0.9 ];

	for( var y = 0; y < 3; ++y )
		for( var x = 0; x < 3; ++x ) {

			if( Math.random() > spawn_chance[ this.level - 2 ] )
				continue;

			var transform = mat4.create();
			mat4.identity( transform );
			mat4.translate( transform, [ this.x + x * 0.25 + 0.25, this.y + y * 0.25 + 0.25, 0.0 ] );

			var house =  Object.create( this.house_models[ this.level - 2 ][ Math.floor( Math.random() * this.house_models[ this.level - 2 ].length ) ] );
			house.transform = transform;

			this.current_houses.push( house );
		}

	this.current_houses_raise = -0.7;
}

cellDisplay.prototype.draw = function( shader ) {
	if( this.previous_houses )
		for( var i = 0; i < this.previous_houses.length; ++i )
			this.previous_houses[ i ].draw( shader );
	for( var i = 0; i < this.current_houses.length; ++i )
		this.current_houses[ i ].draw( shader );
}

cellDisplay.prototype.frameMove = function( elapsed_time ) {
	var cell = this.game.cells[ this.y ][ this.x ];
	if( cell.level != this.level )
		this.setToLevel( cell.level );

	if( this.previous_houses_sink !== null ) {
		this.previous_houses_sink -= elapsed_time * 1.0;
		for( var i = 0; i < this.previous_houses.length; ++i ) {
			this.previous_houses[ i ].transform[ 14 ] = this.previous_houses_sink;
		}

		if( this.previous_houses_sink <= -1.0 ) {
			this.previous_houses_sink = null;
			this.previous_houses = null;
		}

	}

	if( this.current_houses_raise !== null ) {
		this.current_houses_raise = Math.min( this.current_houses_raise + elapsed_time * 0.7, 0.0 );
		for( var i = 0; i < this.current_houses.length; ++i )
			this.current_houses[ i ].transform[ 14 ] = this.current_houses_raise;
		if( this.current_houses_raise >= 0.0 )
			this.current_houses_raise = null;
	}
}

function edgeDisplay( game, edge_models, direction, x, y ) {
	this.game = game;
	this.edge_models = edge_models;
	this.direction = direction;
	this.x = x;
	this.y = y;
	this.model = null;

	var edge = game.edges[ direction ][ y ][ x ];
	this.setToType( edge.type, edge.player );
}

edgeDisplay.prototype.setToType = function( type, player ) {
	this.type = type;
	this.player = player;

	this.model = null;
	if( this.type === null )
		return;

	this.model = {};
	this.model.__proto__ = this.edge_models.edge[ type ];
	this.model.team_colour = [ 1.0, 0.0, 0.0, 1.0 ];
	var translate = mat4.create();
	mat4.identity( translate );
	mat4.translate( translate, [ this.x, this.y + ( this.direction ? 1 : 0 ), 0.0 ] );
	if( !this.direction )
		mat4.rotateZ( translate, Math.PI / 2 );
	this.model.transform = mat4.create();
	mat4.multiply( translate, this.edge_models.edge[ type ].transform, this.model.transform );
}

edgeDisplay.prototype.frameMove = function( elapsed_time ) {
	var edge = this.game.edges[ this.direction ][ this.y ][ this.x ];
	if( edge.type !== this.type || edge.player !== this.player )
		this.setToType( edge.type, edge.player );
}

edgeDisplay.prototype.draw = function( shader ) {
	if( !this.model )
		return;

	this.model.draw( shader );
}

function gameDisplay3d( game ) {
	this.x = 0;
	this.game = game;
	this.canvas = document.getElementById( "game3d");
	this.last_time = new Date().getTime();
    this.rotation = 0.0;
    this.current_drag = null;
    this.rotation_matrix = mat4.create();
    mat4.identity( this.rotation_matrix );

    this.textures = { 
    	whiteblack: new Texture( "models/whiteblack.png" ),
    	road: new Texture( "models/road.png")
    };

    this.bulldozer = new Obj( "js/Bulldozer.obj");
    this.edge_models = { 
    	edge: [ 
	    	null, 
	    	new Obj( "models/utility_road_edge.obj", [0,0,0], 1, this.textures.road ), 
	    	new Obj( "models/utility_water_edge.obj", [ 0, 1, 0 ], 0, this.textures.whiteblack ), 
	    	new Obj( "models/utility_power_edge.obj", [ -1, 1,0 ], 0, this.textures.whiteblack ), 
	    	new Obj( "models/utility_internet_edge.obj", [0,4,0], 0, this.textures.whiteblack ),
	    	new Obj( "models/utility_rubble_edge.obj", [-2,2.5,0], 0, this.textures.whiteblack )
    	],
    };

    this.corner_models = {
    	sources: [
    		null,
    		new Obj( "models/utility_road_X.obj", [ 1.4, 0, 0], 0, this.textures.road ),
    		new Obj( "models/source_water.obj", [ 0, 1, 0], 0, this.textures.whiteblack ),
    		new Obj( "models/source_electricity.obj", [ -1, 1, 0 ], 0, this.textures.whiteblack ),
    		new Obj( "models/source_internet.obj", [ 0, 6.2, 0], 0, this.textures.whiteblack )
    	],
    	straight: [
    		null,
    	    new Obj( "models/utility_road_straight.obj", [ 1.8, 0.0, 0.0], 1, this.textures.road ), 
	    	new Obj( "models/utility_water_straight.obj", [ 0.2, 2, 0 ], 0 , this.textures.whiteblack ),
	    	new Obj( "models/utility_power_straight.obj", [ -1, 5, 0.0], 0, this.textures.road ),
	    	new Obj( "models/utility_internet_straight.obj", [ 0, 5, 0.0], 0, this.textures.road )
    	],
    	corner: [
    		null,
    	    new Obj( "models/utility_road_corner.obj", [0, 0, 0], 0, this.textures.road ),
	    	new Obj( "models/utility_water_corner.obj" , [ 0, 2, 0 ], 2, this.textures.whiteblack ),
	    	new Obj( "models/utility_power_corner.obj", [ -1, 2, 0 ], 2, this.textures.whiteblack ),
	    	new Obj( "models/utility_internet_corner.obj", [ 0, 6.6, 0 ], 2, this.textures.whiteblack )  //Internet
    	],
    	T: [
    		null,
    	    new Obj( "models/utility_road_T.obj", [ 1, 0, 0 ], 0, this.textures.road ), 
	    	new Obj( "models/utility_water_T.obj", [ 0, 2.6, 0], 2, this.textures.whiteblack ), 
	    	new Obj( "models/utility_power_T.obj", [ -1, 3, 0 ], 0, this.textures.whiteblack ), 
	    	new Obj( "models/utility_internet_T.obj", [ 0, 5.4, 0 ], 1, this.textures.whiteblack )
    	],
    	X: [
    		null,
    	    new Obj( "models/utility_road_X.obj", [ 1.4, 0, 0], 0, this.textures.road ), 
	    	new Obj( "models/utility_water_X.obj", [ 0.6, 2, 0 ], 0, this.textures.whiteblack), 
	    	new Obj( "models/utility_power_X.obj", [ -1, 4, 0], 0, this.textures.whiteblack ), 
	    	new Obj( "models/utility_internet_X.obj", [ 0, 5.8, 0], 0, this.textures.whiteblack )
    	]    	
    };

    this.conMap = {};
	this.conMap["1010"] = { model: this.corner_models.straight, rot: 0 };
	this.conMap["0101"] = { model: this.corner_models.straight, rot: 1 };

	var self = this;
	var cell_displays = null;

	this.canvas.onmousemove = function (e) { self.HandleMouseMove(e); };
    this.canvas.onmousedown = function (e) { self.HandleMouseDown(e); };
    this.canvas.onmouseup = function (e) { self.HandleMouseUp(e); };

	var request_id;

	var doFrame = function ( ) {
		request_id = window.requestAnimFrame( doFrame, self.canvas );
		self.renderFrame( );
	}

	function handleContextLost( e ) {
		self.lostContext( );
		e.preventDefault();
		if( request_id !== undefined ) {
			window.cancelRequestAnimFrame( request_id );
			request_id = undefined;
		}
	}

	function handleContextRestored( e ) {
		self.resetContext( );
		doFrame();
	}

	this.canvas.addEventListener('webglcontextlost', handleContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    handleContextRestored();
}

gameDisplay3d.prototype.HandleMouseMove = function( e ) {

    if ( !this.current_drag )
        return;

    this.rotation = (this.current_drag.start_x - e.clientX ) / 30.0;
    var identity = mat4.create();
    mat4.identity(identity);
    mat4.rotateZ(identity, this.rotation, this.rotation_matrix);


}

gameDisplay3d.prototype.HandleMouseDown = function( e ) {
 	var pixel_coords = relMouseCoords( this.canvas, e );
 	// console.log( pixel_coords );
    // console.log( this.pixelToGridCoord( pixel_coords.x, pixel_coords.y ) );



    this.current_drag = { start_x: e.clientX, start_rotation: this.rotation };
    e.preventDefault();
}

gameDisplay3d.prototype.HandleMouseUp = function( e ) {
    this.current_drag = null;
    e.preventDefault();
}

gameDisplay3d.prototype.resetContext = function( ) {
	this.gl = WebGLUtils.setupWebGL(this.canvas);
    this.gl.clearColor(0.2, 0.2, 0.2, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.shader = new ShaderProgram( this.gl, "VertexShader", "PixelShader");
    this.team_shader = new ShaderProgram( this.gl, "VertexShader", "PixelShaderWithTeam");

    this.board_model = new boardModel( this.gl );
    this.grid_model = new gridLineModel( this.gl );

    this.house_models = [
    	[ new houseModel( this.gl, 0.2 ), new houseModel( this.gl, 0.2 ), new houseModel( this.gl, 0.2 ), new houseModel( this.gl, 0.2 ) ],
    	[ new houseModel( this.gl, 0.4 ), new houseModel( this.gl, 0.4 ), new houseModel( this.gl, 0.4 ), new houseModel( this.gl, 0.4 ) ],
    	[ new houseModel( this.gl, 0.7 ), new houseModel( this.gl, 0.7 ), new houseModel( this.gl, 0.7 ), new houseModel( this.gl, 0.7 ) ]
    ];

    var self = this;
    function resetContextOnAll( models ) {
    	for( key in models ) {
    		var sub = models[ key ];
    		if( !sub )
    			continue;
    		if( sub instanceof Array ) {
    			resetContextOnAll( sub );
    			continue;
    		}
    		sub.resetContext( self.gl );
    	}
    }

    resetContextOnAll( this.edge_models );
    resetContextOnAll( this.corner_models );
    resetContextOnAll( this.textures );

    this.cell_displays = new Array( board_height );
    for( var y = 0; y < board_height; ++y ) {
    	this.cell_displays[ y ] = new Array( board_width );
    	for( var x = 0; x < board_width; ++x ) {
    		this.cell_displays[ y ][ x ] = new cellDisplay( this.game, this.house_models, x, y );
    	}
    }

	this.edge_displays = [[],[]];
    for (var i = 0; i < 2; ++i) {
        var height = board_height + (i == 0 ? 1 : 0);
        this.edge_displays[i] = new Array(height);
        for (var y = 0; y < height; ++y) {
            var width = board_width + (i == 0 ? 0 : 1);
            this.edge_displays[i][y] = new Array(width);
            for (var x = 0; x < width; ++x) {
                this.edge_displays[i][y][x] = new edgeDisplay( this.game, this.edge_models, i, x, y );
            }
        }
    }

    this.bulldozer.resetContext( this.gl );
}

gameDisplay3d.prototype.lostContext = function( ) {

    function lostContextOnAll( models ) {
    	for( key in models ) {
    		var sub = models[ key ];
    		if( !sub )
    			continue;
    		if( sub instanceof Array ) {
    			lostContextOnAll( sub );
    			continue;
    		}
    		sub.lostContext( self.gl );
    	}
    }

    lostContextOnAll( this.edge_models );
    lostContextOnAll( this.corner_models );
    lostContextOnAll( this.textures );

	this.bulldozer.lostContext( );

    this.cell_displays = null;
    this.edge_displays = null;
	this.house_models = null;
	this.grid_model = null;
	this.board_model = null;
	this.shader = null;
	this.team_shader = null;
	this.gl = null;
}

function rgbStringToArray( s ) {
	return s.substring( s.indexOf( "(") + 1,s.indexOf( ")") ).split( ',').map( function( s1 ){ return parseInt( s1.trim() ) / 255.0; } ).concat( [1.0]);
}

gameDisplay3d.prototype.gridCoordToPixel = function( x, y ) {

	var pixel_loc = vec4.create();
	mat4.multiplyVec4( this.view_proj, [ x, y, 0.0, 1.0 ], pixel_loc );
	return [ ( ( pixel_loc[ 0] / pixel_loc[ 3 ] ) + 1 ) / 2 * this.canvas.width, ( 1.0 -( ( pixel_loc[ 1] / pixel_loc[ 3 ] ) + 1 ) / 2 ) * this.canvas.height ];
}

gameDisplay3d.prototype.pixelToGridCoord = function( x, y ) {
	var cursor_pos = vec3.create();
	cursor_pos[ 0 ] = ((( 2.0 * x ) / this.canvas.width ) - 1.0 ) / this.proj[ 0 ];
	cursor_pos[ 1 ] = -((( 2.0 * y ) / this.canvas.height ) - 1.0 ) / this.proj[ 5 ];
	cursor_pos[ 2 ] = -1.0;

	var inverse_view = mat4.create();
	mat4.inverse( this.view, inverse_view );

	var ray_direction = vec4.create();
	mat4.multiplyVec4( inverse_view, [ 0, 0, 1, 0], ray_direction );
	vec3.normalize( ray_direction );

	var ray_origin = vec3.create();
	mat4.multiplyVec3( inverse_view, cursor_pos, ray_origin );

	var scalar = -( ray_origin[ 2 ] / ray_direction [ 2 ] );
	return [ ray_origin[ 0 ] + ray_direction[ 0 ] * scalar, ray_origin[ 1 ] + ray_direction[ 1 ] * scalar ]
}

gameDisplay3d.prototype.renderFrame = function( ) {
	var self = this;
	//this.board_model.colour = rgbStringToArray( document.getElementById( "board").style.color );


	//Calculate delta time
    var current_time = new Date().getTime();
    var elapsed_time = ( current_time - this.last_time ) / 1000.0;
    this.last_time = current_time;

    for( var y = 0; y < board_height; ++y ) {
    	for( var x = 0; x < board_width; ++x ) {
    		this.cell_displays[ y ][ x ].frameMove( elapsed_time );
    	}
    }

    for (var i = 0; i < 2; ++i) {
        var height = board_height + (i == 0 ? 1 : 0);
        for (var y = 0; y < height; ++y) {
            var width = board_width + (i == 0 ? 0 : 1);
            for (var x = 0; x < width; ++x) {
                this.edge_displays[i][y][x].frameMove( elapsed_time );
            }
        }
    }


    //Handle window size change
    if (this.canvas.clientWidth != this.canvas.width || this.canvas.clientHeight != this.height)
    {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.gl.viewport(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

        this.proj = mat4.create();

        //mat4.perspective(45, this.canvas.clientWidth / this.canvas.clientHeight, 1, 50, this.proj);

        //var board_diag_half_length = Math.sqrt( board_height * board_height + board_width * board_width ) / 2;
        //var cam_vert_dist = Math.sqrt( board_diag_half_length * board_diag_half_length + board_diag_half_length * board_diag_half_length ) / 2;
        //mat4.ortho( -board_diag_half_length, board_diag_half_length, -cam_vert_dist, cam_vert_dist, 0.0, cam_vert_dist * 2, this.proj );

        var aspect =  this.canvas.height / this.canvas.width;
		mat4.ortho( -5, 5, 5 * aspect, -5 * aspect, 0.0, 100, this.proj );
    }


    this.cam_position = vec3.create();
    mat4.multiplyVec3( this.rotation_matrix, [ -4, -4, 10], this.cam_position );

    this.view = mat4.create();
    mat4.lookAt(this.cam_position, [ board_width / 2, board_height / 2,0], [0, 0, -1], this.view);
    //mat4.lookAt(this.cam_position, [ 0.0, 0.0, 0.0], [0, 1, 0], this.view);

    this.view_proj = mat4.create();
    mat4.multiply(this.proj, this.view, this.view_proj);  


    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);


    //Draw non-team elements
    this.gl.useProgram( this.shader.shader_program );
    this.gl.uniformMatrix4fv( this.shader.view_proj, false, this.view_proj );
    var time_float = current_time % 100000 / 1000.0;
    this.gl.uniform1f( this.shader.time, time_float );

    this.board_model.draw( this.shader );
    this.grid_model.draw( this.shader );

    for( var y = 0; y < board_height; ++y ) {
    	for( var x = 0; x < board_width; ++x ) {
    		this.cell_displays[ y ][ x ].draw( this.shader );
    	}
    }

    //Draw team elements
  	this.gl.useProgram( this.team_shader.shader_program );
  	this.gl.uniform1f( this.team_shader.time, time_float );
	this.gl.uniformMatrix4fv( this.team_shader.view_proj, false, this.view_proj );

    for (var i = 0; i < 2; ++i) {
        var height = board_height + (i == 0 ? 1 : 0);
        for (var y = 0; y < height; ++y) {
            var width = board_width + (i == 0 ? 0 : 1);
            for (var x = 0; x < width; ++x) {
                this.edge_displays[i][y][x].draw( this.team_shader );
            }
        }
    }



    var i = 0;
    function renderX( models ) {
    	for( key in models ) {
    		var sub = models[ key ];
    		if( !sub )
    			continue;
    		if( sub instanceof Array ) {
    			renderX( sub );
    			continue;
    		}
    		if( i == self.x && sub.loaded ) {
    			sub.draw( self.team_shader );
			}
    		++i;
    	}
    }

    renderX( this.corner_models );

    //Update corner connections
    for (var y = 0; y < board_height + 1; ++y) {
        for (var x = 0; x < board_width + 1; ++x) {
            var corner = this.game.corners[y][x];
        	for (var type = 0; type < 4; ++type) {
        		for (var owner = 0; owner < 2; ++owner) {
            		//TODO: handle source
            		var conData = this.game.getConnectionData(x, y, type, owner);
            		var modelData = this.conMap[conData];
            		//type, owner.
            	}
            }
        }
    }
}

function ShaderProgram(gl, vertex_shader_name, pixel_shader_name) {
    var vertex_shader = loadShader(gl, vertex_shader_name);
    var pixel_shader = loadShader(gl, pixel_shader_name);
    this.shader_program = gl.createProgram();
    gl.attachShader(this.shader_program, vertex_shader);
    gl.attachShader(this.shader_program, pixel_shader);
    gl.linkProgram(this.shader_program);
    if (!gl.getProgramParameter(this.shader_program, gl.LINK_STATUS) && !gl.isContextLost()) {
        console.log("Error in program linking: " + gl.getProgramInfoLog(this.shader_program));
        throw new Error("Failed to compile shader");
    }

    this.position_attribute = gl.getAttribLocation(this.shader_program, "local_position");
    this.uv_attribute = gl.getAttribLocation(this.shader_program, "local_uv");
    this.normal_attribute = gl.getAttribLocation(this.shader_program, "local_normal");
    // this.tangent_attribute = gl.getAttribLocation(this.shader_program, "local_tangent");
    // this.bone_indices_attribute = gl.getAttribLocation(this.shader_program, "bone_indices");
    // this.blend_weights_attribute = gl.getAttribLocation(this.shader_program, "blend_weights");
    // this.colour_map = gl.getUniformLocation(this.shader_program, "colour_map");
    // this.normal_map = gl.getUniformLocation(this.shader_program, "normal_map");
    this.team_colour_mask = gl.getUniformLocation( this.shader_program, "team_colour_mask");
    this.view_proj = gl.getUniformLocation( this.shader_program, "view_proj" );
    this.world = gl.getUniformLocation(this.shader_program, "world");
    this.colour = gl.getUniformLocation( this.shader_program, "colour");
    this.team_colour = gl.getUniformLocation( this.shader_program, "team_colour");
    // this.animation_palette = gl.getUniformLocation(this.shader_program, "animation_palette");
    this.time = gl.getUniformLocation( this.shader_program, "time");
}
