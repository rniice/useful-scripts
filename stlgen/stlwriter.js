//receives the datastructure containing the vertices and appends ascii format to output file 
var stl_string = "";

var data_vertices = [[[]]];				//data_vertices is the array that contains the vertices
var data_normals = [[]];				//data_normals is the array that contains the normal vectors

var ascii_indent = "    ";

function write(format) {
	switch (format) {
		case ascii:
			stl_string.push("solid " + "blah" + "\n"); 

			for (var i = 0; i < data.length; i++){
				stl_string.push("facet normal " + data_normals[i][0] + " " + data_normals[i][1] + " " + data_normals[i][2] + "\n");
				stl_string.push(ascii_indent + "outer loop\n");
				stl_string.push(ascii_indent + ascii_indent + "vertex " + data_vertices[i][0][0] + " " + data_vertices[i][0][1] + " " + data_vertices[i][0][2] + "\n");
				stl_string.push(ascii_indent + ascii_indent + "vertex " + data_vertices[i][1][0] + " " + data_vertices[i][1][1] + " " + data_vertices[i][1][2] + "\n");
				stl_string.push(ascii_indent + ascii_indent + "vertex " + data_vertices[i][2][0] + " " + data_vertices[i][2][1] + " " + data_vertices[i][2][2] + "\n");
				stl_string.push(ascii_indent + "endloop\n");
				stl_string.push("endfacet\n")
			}

			stl_string.push("endsolid " + "blah" + "\n");
			break;

		case binary:
			//code block use buffer object or use protobuf


			break;
		default:
			console.log("export format not selected");

	}


}


/*format ascii

solid name
facet normal ni nj nk		//n or v is a floating-point number in format, e.g., "2.648000e-002" (v must be non-negative)
    outer loop
        vertex v1x v1y v1z
        vertex v2x v2y v2z
        vertex v3x v3y v3z
    endloop
endfacet

endsolid name

*/


/*format binary //floating point values are little endian 

UINT8[80] – Header
UINT32 – Number of triangles

foreach triangle
REAL32[3] – Normal vector
REAL32[3] – Vertex 1
REAL32[3] – Vertex 2
REAL32[3] – Vertex 3
UINT16 – Attribute byte count
end

*/



/*

// Constructor
function Foo(bar) {
  // always initialize all instance properties
  this.bar = bar;
  this.baz = 'baz'; // default value
}
// class methods
Foo.prototype.fooBar = function() {

};
// export the class
module.exports = Foo;
Instantiating a class is simple:

// constructor call
var object = new Foo('Hello');

*/