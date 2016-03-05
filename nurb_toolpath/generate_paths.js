var fs = require("fs");
//var path = require("path");

var config = require('./config.json');			//load in configuration settings
var functions = require('./functions.js');		//import functions to call

var gcode = "";									//initialize gcode output string

//load the path config layout (to be added later)  
//load an stl and parse into 2d shapes (to be added later)  https://www.npmjs.com/package/dxf-parsing
//https://www.npmjs.com/package/dxf-parser  https://www.npmjs.com/package/stl-reader


gcode += functions.startPrint();			//start print sequence

//produce a prime bead
gcode += functions.travel(0, config.path_options.y_start + 60, config.path_options.z_start, config.standard.travel_speed);
gcode += functions.travelExtrude(150, config.path_options.y_start + 60, config.path_options.z_start, config.standard.feedrate);	

//move to center of build platform at build height
gcode += functions.travel(config.path_options.x_start, config.path_options.y_start, config.path_options.z_start, config.standard.travel_speed);


var initial_positions = functions.currentPosition();
var x = initial_positions[0];
var y = initial_positions[1];
var z = initial_positions[2];
var e = initial_positions[3];

while(z <= 10) {
	//make an box single shell
	gcode += functions.travelExtrude(x+20, y, z, config.standard.feedrate);
	gcode += functions.travelExtrude(x+20, y-20, z, config.standard.feedrate);
	gcode += functions.travelExtrude(x, y-20, z, config.standard.feedrate);
	gcode += functions.travelExtrude(x, y, z, config.standard.feedrate);

	z += config.standard.layer_thickness;  //update next position
	gcode += functions.travel(x, y, z, config.standard.travel_speed);
}


gcode += functions.endPrint();			//end print sequence


//WRITE GCODE TO FILE
fs.writeFile(config.path_options.filenameOut, gcode, function(err) {
	if(err) {
		console.log(err);
	}
	else {
		console.log("the file was saved!");
	}
});