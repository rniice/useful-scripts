var config = require('./config.json');	

//MEMBER VARIABLES 
var x_pos = 0,										//current x position, initialized to home
y_pos = 0,											//current y position, initialized to home
z_pos = 0,											//current z position, initialized to home
e_pos = 0,
filament_area = areaCircle(config.standard.filament_diameter);
//MEMBER VARIABLES



var currentPosition = function() {					//returns current position
	var positions = [x_pos, y_pos, z_pos, e_pos];

	return positions;
}


var arcTravel = function (X, Y, I, J, clockwise) {		
	var gcode = "";									//initializes string of commands
	var command = "";

	x_pos = I; 				//update the global position variables
	y_pos = J; 				//update the global position variables
	//z_pos = Z; 				//update the global position variables

	if(clockwise) {			//use G2 command for clockwise
		command = "G2 ";
	}
	else {					//use G3 command for counterclockwise
		command = "G3 ";
	}

	gcode = command + "X" + Number(X.toFixed(3)) + " Y" + Number(Y.toFixed(3)) + " I" + Number(I.toFixed(3)) + " J" + Number(J.toFixed(3)) +" F" + Number(F.toFixed(3)) + "\n";

	return gcode;

	//format:
	//G3 X13.1383 Y-22.9093 Z-20.000 I21.3019 J-15.3736 K30.5
	/*
	G3 F800.0 X10.3451 Y-25.5545 I6.867 J-36.106
	G3 X12.2348 Y-21.7952 I-0.0005 J-17.9997
	G1 X12.3138 Y-21.904
	G3 X13.1383 Y-22.9093 I21.3019 J-15.3736
	*/

}

var travel = function (X, Y, Z, F) {	
	var gcode = "";

	x_pos = X; 				//update the global position variables
	y_pos = Y; 				//update the global position variables
	z_pos = Z; 				//update the global position variables

	gcode = "G1 X" + Number(X.toFixed(3)) + " Y" + Number(Y.toFixed(3)) + " Z" + Number(Z.toFixed(3)) + " F" + Number(F.toFixed(3)) + "\n";

	return gcode;
}

var travelExtrude = function (X, Y, Z, F) {	
	var gcode = "";

	e_pos += calculateLinePathExtrudeLength(X, Y, Z);										//update the e_pos counter
	gcode = "G1 X" + Number(X.toFixed(3)) + " Y" + Number(Y.toFixed(3)) + " Z" + Number(Z.toFixed(3)) + " E" + Number(e_pos.toFixed(3)) + " F" + Number(F.toFixed(3)) + "\n";

	x_pos = X; 				//update the global position variables
	y_pos = Y; 				//update the global position variables
	z_pos = Z; 				//update the global position variables

	return gcode;
}


var arcTravelExtrude = function (X, Y, I, J, clockwise) {		
	var gcode = "";									//initializes string of commands
	var command = "";

	e_pos += calculateLinePathExtrudeLength(X, Y, Z);										//update the e_pos counter

	if(clockwise) {			//use G2 command for clockwise
		command = "G2 ";
	}
	else {					//use G3 command for counterclockwise
		command = "G3 ";
	}

	gcode = command + "X" + Number(X.toFixed(3)) + " Y" + Number(Y.toFixed(3)) + " I" + Number(I.toFixed(3)) + " J" + Number(J.toFixed(3)) +" E" + Number(e_pos.toFixed(3)) +" F" + Number(F.toFixed(3)) + "\n";

	x_pos = I; 				//update the global position variables
	y_pos = J; 				//update the global position variables
	//z_pos = Z; 			//update the global position variables

	return gcode;
}


var startPrint = function(type) {

	var gcode = [
	"G21",			//use metric
	"G28",
	"G90",			//use absolute coordinates
	"G92 E0",
	"M82",			//use absolute distance for extusion
	"M109 " + "S" + config.standard.nozzle_temp.toString(), //set temp and wait to reach it
	"G1 Z50 F1800",	//move up to 5 cm
	"G1 E30 F250",	//prime the nozzle with 100mm of filament
	"G92 E0",		//reset extruder position to zero
	"G4 P5000\n"		//wait for 5 seconds to allow user to clear nozzle
	//"M106 S0",
	//"M106 S255\n"		//turn on the fan full tilt
	];

	return gcode.join("\n");
}


var endPrint = function(type) {
	var gcode = [
		"G92 E0",
		"G1 Z40 F200",	//move up to 4 cm
		"M107",
		"M104 S0",
		"G28 X0", 				//home x axis
		"M84\n"
	];

	return gcode.join("\n");
}


function calculateLinePathLength (X, Y, Z) {
	var length = Math.sqrt(Math.pow((X-x_pos), 2) + Math.pow((Y-y_pos), 2) + Math.pow((Z-z_pos), 2));

	return length;
}


function calculateLinePathExtrudeLength (X, Y, Z) {
	var length = calculateLinePathLength(X,Y,Z);
	var L_filament = length * config.standard.bead_width * config.standard.layer_thickness / filament_area;

	return L_filament;
}


function calculateArcPathLength (X, Y, I, J) {
	var length;
	var L_filament;

	return L_filament;
}


function calculateArcPathExtrudeLength () {
	var length = calculateLinePathLength(X,Y,I,J);
	var E = length * config.standard.bead_width * config.standard.layer_thickness / filament_area;

	return E;
}


function dip (dip_amt, speed) {
	var z = z_pos - dip_amt;	//calculate the absolute coordinates for z travel
	z_pos = z;						//update the global position variables

	return ("G1 Z" + Number(z.toFixed(6)) + " F" + Number(speed.toFixed(3)) + "\n");
}


function extrude (E, speed) {	
	return ("G1 E" + Number(E.toFixed(6)) + " F" + Number(speed.toFixed(3)) + "\nG92 E0\n");
}


function retract (E, speed) {	
	return ("G1 E" + "-" + Number(E.toFixed(6)) + " F" + Number(speed.toFixed(3)) + "\nG92 E0\n");
}


function prime (E, speed) {	
	return ("G1 E" + Number(E.toFixed(6)) + " F" + Number(speed.toFixed(3)) + "\nG92 E0\n");
}


function dwell (millisec) {
	return ("G4 P" + Number(millisec.toFixed(3)) + "\n");	//dwell for X milliseconds
}


function volumeCircle(D, depth) {	
	return areaCircle(D) * depth; 
}

function areaCircle (D) {
	return Math.PI * Math.pow(D/2, 2);
}


exports.currentPosition = currentPosition;

exports.travel = travel;
exports.travelExtrude = travelExtrude;

exports.arcTravel = arcTravel;
exports.arcTravelExtrude = arcTravelExtrude;

exports.startPrint = startPrint;
exports.endPrint = endPrint;