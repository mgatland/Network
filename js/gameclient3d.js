

function bindBuffer( shader ) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
    this.gl.enableVertexAttribArray(shader.position_attribute);
    this.gl.vertexAttribPointer(shader.position_attribute, 3, this.gl.FLOAT, false, 12, 0);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
}

function draw( shader ) {
	//Bind mesh
	this.bindBuffer( shader );

	//World matrix
	this.gl.uniformMatrix4fv( shader.world, false, this.transform );

	//Colour
	this.gl.uniform4fv( shader.colour, this.colour )

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
		0.0, 0.0, 0.0,
		board_width, 0.0, 0.0,
		board_width, board_height, 0.0,
		0.0, board_height, 0.0
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
		vertices.push( x ); vertices.push( board_height ); vertices.push( 0 );
	}

	for( var y = 0; y <= board_height; ++y ) {
		vertices.push( 0 ); vertices.push( y ); vertices.push( 0 );
		vertices.push( board_width ); vertices.push( y ); vertices.push( 0 );
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

	this.num_indices = 10 * 3;
	this.primitive_type = this.gl.TRIANGLES;
	this.index_type = this.gl.UNSIGNED_SHORT;
	this.colour = [ 0.8, 0.8, 0.8, 1.0 ];

	this.transform = mat4.create( );
	mat4.identity( this.transform );

	var width_scale = Math.random( ) * 0.1 + 0.04;
	var height_scale = height * ( Math.random() * 0.5 + 0.75 );

	var vertices = [
		-width_scale, -width_scale, 0.0,
		width_scale, -width_scale, 0.0,
		width_scale, width_scale, 0.0,
		-width_scale, width_scale, 0.0,
		-width_scale, -width_scale, height_scale,
		width_scale, -width_scale, height_scale,
		width_scale, width_scale, height_scale,
		-width_scale, width_scale, height_scale,
	];

	var indices = [
		0, 1, 5,
		0, 5 ,4,
		1, 2, 6,
		1, 6, 5,
		2, 3, 7,
		2, 7, 6,
		3, 0, 4,
		3, 4, 7,
		4, 5, 6,
		4, 6, 7
	];

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



function gameDisplay3d( game ) {
	this.game = game;
	this.canvas = document.getElementById( "game3d");
	this.last_time = new Date().getTime();
    this.rotation = 0.0;
    this.current_drag = null;
    this.rotation_matrix = mat4.create();
    mat4.identity( this.rotation_matrix );

	var self = this;

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

    this.board_model = new boardModel( this.gl );
    this.grid_model = new gridLineModel( this.gl );

    this.small_house_model = [ new houseModel( this.gl, 0.4 ), new houseModel( this.gl, 0.4 ), new houseModel( this.gl, 0.4 ), new houseModel( this.gl, 0.4 ) ];
}

gameDisplay3d.prototype.lostContext = function( ) {
	this.small_house_model = null;
	this.grid_model = null;
	this.board_model = null;
	this.shader = null;
	this.gl = null;
}

function rgbStringToArray( s ) {
	return s.substring( s.indexOf( "(") + 1,s.indexOf( ")") ).split( ',').map( function( s1 ){ return parseInt( s1.trim() ) / 255.0; } ).concat( [1.0]);
}

gameDisplay3d.prototype.renderFrame = function( ) {

	//this.board_model.colour = rgbStringToArray( document.getElementById( "board").style.color );


	//Calculate delta time
    var current_time = new Date().getTime();
    var elapsed_time = ( current_time - this.last_time ) / 1000.0;
    this.last_time = current_time;

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
    //mat4.lookAt(this.cam_position, [ 0.0, 0.0, 0.0], [0, 0, -1], this.view);

    this.view_proj = mat4.create();
    mat4.multiply(this.proj, this.view, this.view_proj);  


    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.useProgram( this.shader.shader_program );
    this.gl.uniformMatrix4fv( this.shader.view_proj, false, this.view_proj );

    this.board_model.draw( this.shader );
    this.grid_model.draw( this.shader );

    this.house_model.draw( this.shader );
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
    // this.uv_attribute = gl.getAttribLocation(this.shader_program, "local_uv");
    // this.normal_attribute = gl.getAttribLocation(this.shader_program, "local_normal");
    // this.tangent_attribute = gl.getAttribLocation(this.shader_program, "local_tangent");
    // this.bone_indices_attribute = gl.getAttribLocation(this.shader_program, "bone_indices");
    // this.blend_weights_attribute = gl.getAttribLocation(this.shader_program, "blend_weights");
    // this.colour_map = gl.getUniformLocation(this.shader_program, "colour_map");
    // this.normal_map = gl.getUniformLocation(this.shader_program, "normal_map");
    this.view_proj = gl.getUniformLocation( this.shader_program, "view_proj" );
    this.world = gl.getUniformLocation(this.shader_program, "world");
    this.colour = gl.getUniformLocation( this.shader_program, "colour");
    // this.animation_palette = gl.getUniformLocation(this.shader_program, "animation_palette");
}
