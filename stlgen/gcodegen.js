var stlgenerator = require("./stlgenerator.js");
var partconfig = require("./partconfig.json");

//GLOBALS
var gcodeTest = "",	//initializes string of commands
x_pos,				//previous x position
y_pos,				//previous y position
z_pos;				//previous z position



//import settings that define what to make


//loop through the settings file to generate geometry