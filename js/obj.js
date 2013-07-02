

function Obj( url )
{
    this.vertex_data = null;
    this.index_data = null;
    this.loaded = false;
    this.url = url;

    console.log( "loading " + url );

    var self = this;

    var req = new XMLHttpRequest();
    req.onreadystatechange = function () { self.ProcessLoadObj(req) };
    req.open("GET", url, true);
    req.send(null);
}

Obj.prototype.ProcessLoadObj = function (req)
{
    // only if req shows "complete"
    if (req.readyState == 4)
        this.DoLoadObj( req.responseText );
}


Obj.prototype.DoLoadObj = function ( text )
{
    var vertex_data = [ ];
    var index_data = [ ];

    var vertex = [ ];
    var normal = [ ];
    var texture = [ ];
    var facemap = { };
    var index = 0;

    // This is a map which associates a range of indices with a name
    // The name comes from the 'g' tag (of the form "g NAME"). Indices
    // are part of one group until another 'g' tag is seen. If any indices
    // come before a 'g' tag, it is given the group name "_unnamed"
    // 'group' is an object whose property names are the group name and
    // whose value is a 2 element array with [<first index>, <num indices>]
    this.groups = { };
    var groups = this.groups;
    var currentGroup = [-1, 0];
    groups["_unnamed"] = currentGroup;

    var lines = text.split("\n");
    for (var lineIndex in lines) {
        var line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, "");

        // ignore comments
        if (line[0] == "#")
            continue;

        var array = line.split(" ");
        if (array[0] == "g") {
            // new group
            currentGroup = [index_data.length, 0];
            groups[array[1]] = currentGroup;
        }
        else if (array[0] == "v") {
            // vertex
            vertex.push(parseFloat(array[1]));
            vertex.push(parseFloat(array[2]));
            vertex.push(parseFloat(array[3]));
        }
        else if (array[0] == "vt") {
            // normal
            texture.push(parseFloat(array[1]));
            texture.push( 1.0 - parseFloat(array[2]));
        }
        else if (array[0] == "vn") {
            // normal
            normal.push(parseFloat(array[1]));
            normal.push(parseFloat(array[2]));
            normal.push(parseFloat(array[3]));
        }
        else if (array[0] == "f") {
            // face
            if (array.length != 4) {
                console.log("*** Error: face '"+line+"' not handled");
                continue;
            }

            for (var i = 1; i < 4; ++i) {
                if (!(array[i] in facemap)) {
                    // add a new entry to the map and arrays
                    var f = array[i].split("/");
                    var vtx, nor, tex;

                    if (f.length == 1) {
                        vtx = parseInt(f[0]) - 1;
                        nor = vtx;
                        tex = vtx;
                    }
                    else if (f.length = 3) {
                        vtx = parseInt(f[0]) - 1;
                        tex = parseInt(f[1]) - 1;
                        nor = parseInt(f[2]) - 1;
                    }
                    else {
                        console.log("*** Error: did not understand face '"+array[i]+"'");
                        return null;
                    }

                    // do the vertices
                    var x = 0;
                    var y = 0;
                    var z = 0;
                    if (vtx * 3 + 2 < vertex.length) {
                        x = vertex[vtx*3];
                        y = vertex[vtx*3+1];
                        z = vertex[vtx*3+2];
                    }
                    vertex_data.push(x);
                    vertex_data.push(y);
                    vertex_data.push(z);

                    // do the normals
                    x = 0;
                    y = 0;
                    z = 1;
                    if (nor * 3 + 2 < normal.length) {
                        x = normal[nor*3];
                        y = normal[nor*3+1];
                        z = normal[nor*3+2];
                    }
                    vertex_data.push(x);
                    vertex_data.push(y);
                    vertex_data.push(z);

                    //Dummy tangents
                    vertex_data.push(1.0);
                    vertex_data.push(0.0);
                    vertex_data.push(0.0);
                    vertex_data.push(1.0);

                    // do the textures
                    x = 0;
                    y = 0;
                    if (tex * 2 + 1 < texture.length) {
                        x = texture[tex*2];
                        y = texture[tex*2+1];
                    }
                    vertex_data.push(x);
                    vertex_data.push(y);

                    facemap[array[i]] = index++;
                }

                index_data.push(facemap[array[i]]);
                currentGroup[1]++;
            }
        }
    }

    var vertex_stride = 12;
    var num_vertices = vertex_data.length / vertex_stride;

    var tan1 = new Array( num_vertices * 3 );
    var tan2 = new Array( num_vertices * 3 );
    for( var i = 0; i < num_vertices * 3; ++i )
    {
        tan1[ i ] = 0;
        tan2[ i ] = 0;
    }

    //Iterate over triangles and sum all the tangents for the vertices
    var num_indices = index_data.length;
    for( var i = 0; i < num_indices; i+=3 )
    {
        var v1i = index_data[ i + 0 ] * vertex_stride;
        var v2i = index_data[ i + 1 ] * vertex_stride;
        var v3i = index_data[ i + 2 ] * vertex_stride;

        var p1x = vertex_data[ v2i + 0 ] - vertex_data[ v1i + 0 ];
        var p1y = vertex_data[ v2i + 1 ] - vertex_data[ v1i + 1 ];
        var p1z = vertex_data[ v2i + 2 ] - vertex_data[ v1i + 2 ];

        var p2x = vertex_data[ v3i + 0 ] - vertex_data[ v1i + 0 ];
        var p2y = vertex_data[ v3i + 1 ] - vertex_data[ v1i + 1 ];
        var p2z = vertex_data[ v3i + 2 ] - vertex_data[ v1i + 2 ];

        var uv1x = vertex_data[ v2i + 10 ] - vertex_data[ v1i + 10 ];
        var uv1y = vertex_data[ v2i + 11 ] - vertex_data[ v1i + 11 ];

        var uv2x = vertex_data[ v3i + 10 ] - vertex_data[ v1i + 10 ];
        var uv2y = vertex_data[ v3i + 11 ] - vertex_data[ v1i + 11 ];

        var r = 1.0 / ( uv1x * uv2y - uv2x * uv1y );
        var sdirx = (uv2y * p1x - uv1y * p2x) * r;
        var sdiry = (uv2y * p1y - uv1y * p2y) * r;
        var sdirz = (uv2y * p1z - uv1y * p2z) * r;

        var tdirx = (uv1x * p2x - uv2x * p1x) * r;
        var tdiry = (uv1x * p2y - uv2x * p1y) * r;
        var tdirz = (uv1x * p2z - uv2x * p1z) * r;

        var tanv1i = index_data[ i + 0 ] * 3;
        tan1[ tanv1i + 0 ] += sdirx;
        tan1[ tanv1i + 1 ] += sdiry;
        tan1[ tanv1i + 2 ] += sdirz;

        tan2[ tanv1i + 0 ] += tdirx;
        tan2[ tanv1i + 1 ] += tdiry;
        tan2[ tanv1i + 2 ] += tdirz;

        var tanv2i = index_data[ i + 1 ] * 3;
        tan1[ tanv2i + 0 ] += sdirx;
        tan1[ tanv2i + 1 ] += sdiry;
        tan1[ tanv2i + 2 ] += sdirz;

        tan2[ tanv2i + 0 ] += tdirx;
        tan2[ tanv2i + 1 ] += tdiry;
        tan2[ tanv2i + 2 ] += tdirz;

        var tanv3i = index_data[ i + 2 ] * 3;
        tan1[ tanv3i + 0 ] += sdirx;
        tan1[ tanv3i + 1 ] += sdiry;
        tan1[ tanv3i + 2 ] += sdirz;

        tan2[ tanv3i + 0 ] += tdirx;
        tan2[ tanv3i + 1 ] += tdiry;
        tan2[ tanv3i + 2 ] += tdirz;
    }

    for( var i = 0; i < num_vertices; ++i )
    {
        var vi = i * vertex_stride;
        var vti = i * 3;

        var nx = vertex_data[ vi + 3 ];
        var ny = vertex_data[ vi + 4 ];
        var nz = vertex_data[ vi + 5 ];

        var tx = tan1[ vti + 0 ];
        var ty = tan1[ vti + 1 ];
        var tz = tan1[ vti + 2 ];

        var ntdot = nx * tx + ny * ty + nz * tz;
        var tangentx = tx - nx * ntdot;
        var tangenty = ty - ny * ntdot;
        var tangentz = tz - nz * ntdot;
        var tangent_length = Math.sqrt( tangentx * tangentx + tangenty * tangenty + tangentz * tangentz );
        
        vertex_data[ vi + 6 ] = tangentx / tangent_length;
        vertex_data[ vi + 7 ] = tangenty / tangent_length;
        vertex_data[ vi + 8 ] = tangentz / tangent_length;

        ///xyzzy
        var crossx = ny * tz - nz * ty;
        var crossy = nz * tx - nx * tz;
        var crossz = nx * ty - ny * tx;

        var ct2d = crossx * tan2[ vti + 0 ] + crossy * tan2[ vti + 1 ] + crossz * tan2[ vti + 2 ];
        vertex_data[ vi + 9 ] = ( ct2d < 0.0 ? -1.0 : 1.0 );
    }

    this.index_data = index_data;
    this.vertex_data = vertex_data;
    this.groups = groups;

    if( this.gl )
        this.resetContext( this.gl );

    this.loaded = true;
    console.log( "Loaded " + this.url );
};

Obj.prototype.resetContext = function ( gl ) {

    this.gl = gl;
    if( !this.vertex_data )
        return;

    // set the VBOs
    this.vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex_data), gl.STATIC_DRAW);
    
    this.index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.index_data), gl.STREAM_DRAW);
    
    this.num_indices = this.index_data.length;
    this.primitive_type = gl.TRIANGLES;
    this.colour = [ 1.0, 1.0, 1.0, 1.0 ];
    this.index_type = gl.UNSIGNED_SHORT;

    this.transform = mat4.create();
    mat4.identity( this.transform );

    mat4.rotateX( this.transform, Math.PI / 2 );
    mat4.scale( this.transform, [ 0.06, 0.06, 0.06 ] );

};

Obj.prototype.lostContext = function( ) {
    this.vertex_buffer = null;
    this.index_buffer = null;
    this.gl = null;
};

Obj.prototype.bindBuffer = function( shader )
{
    var gl = this.gl;
    //Bind vertex buffer
    gl.bindBuffer( gl.ARRAY_BUFFER, this.vertex_buffer );
    gl.enableVertexAttribArray( shader.position_attribute );
    gl.vertexAttribPointer( shader.position_attribute, 3, gl.FLOAT, false, 48, 0 );
    gl.enableVertexAttribArray( shader.normal_attribute );
    gl.vertexAttribPointer( shader.normal_attribute, 3, gl.FLOAT, false, 48, 12 );
    /*
    gl.enableVertexAttribArray( shader.tangent_attribute );
    gl.vertexAttribPointer( shader.tangent_attribute, 4, gl.FLOAT, false, 48, 24 );
    gl.enableVertexAttribArray( shader.uv_attribute );
    gl.vertexAttribPointer( shader.uv_attribute, 2, gl.FLOAT, false, 48, 40 ); */
    
    //Bind index buffer
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer );
}

Obj.prototype.draw = draw;