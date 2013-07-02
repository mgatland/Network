
function Texture( url ) {
	var self = this;
	this.loaded = false;

	console.log( "Loading " + url );

	this.image = new Image();
	this.image.onload = function ( ) { 
		self.loaded = true;
		console.log( "Loaded " + url );
		if( self.gl ) 
			self.resetContext( self.gl ); 
	};
	this.image.src = url;
}

Texture.prototype.resetContext = function( gl ) {
	this.gl = gl;

	if( !this.loaded )
		return;

	this.texture = this.gl.createTexture();
	this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);

    console.log( "Reset " + this.image.src );
}

Texture.prototype.lostContext = function () {
	this.texture = null;
}
