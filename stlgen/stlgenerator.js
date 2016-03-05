var fs = require("fs"),												//import required packages
split = require("split"),
math = require("mathjs"),
stlWriter = require("./stlwriter.js"),								//import stlgenerator specific files
importedVertices = require("./vertices.json"),
filenameOut = "C:/Users/croketm/buildplatform/bedTest.gcode",		//filesystem relevant section
config = require('./config.json'),									//load in configuration settings from .json file here
test = "test1";  													//run this test configuration name

var linearAlgebra = require('linear-algebra')({add: require('add')});		 // initialise it with higher precision
var Vector = linearAlgebra.Vector;						//create vector object
var Matrix = linearAlgebra.Matrix;						//creat matrix object


var name = config[test].name;
var res_linear = config[test].resolution[0];						//resolving config file settings to named variables
var res_angular = config[test].resolution[1];
var output_format = config[test].format;


console.log('process:           ' + process.argv[0]);				// print process.argv 
console.log('path:              ' + process.argv[1]);
console.log('config:            ' + process.argv[2]);

console.log('solid name:        ' + name);
console.log('resolution[mm]:    ' + res_linear);					//print configuration settings selected
console.log('resolution[deg]:   ' + res_angular);
console.log('output format:     ' + output_format);



//keep appending to the 3d model datastructure

//stlWriter.write(data, name, filenameOut);						//write file



//generate primitive 2 dimensional shapes
function generateCircle(outer_diam, res_angular) {
	var data2D = [];

	for (var angle = 0; angle < 360; angle+=res_angular) {		//start at zero degrees and rotate around at angular resolution
		var x = Math.cos(angle)*outer_diam/2;					//cos (theta) = x / radius
		var y = Math.sin(angle)*outer_diam/2;					//sin (theta) = x / radius
		data2D.push([x,y]);										//[x,y] add to array of points
	}			

	//connect in series to form triangles

	return data2D;
}


function generateHollowCircle(outer_diam, inner_diam, res_angular) {
	var data2D = [];

	for (var angle = 0; angle < 360; angle+=res_angular) {		//start at zero degrees and rotate around at angular resolution
		var x_outer = Math.cos(angle)*outer_diam/2;				//cos (theta) = x / radius
		var y_outer = Math.sin(angle)*outer_diam/2;				//sin (theta) = x / radius
		var x_inner = Math.cos(angle)*inner_diam/2;				//cos (theta) = x / radius
		var y_inner = Math.sin(angle)*inner_diam/2;				//sin (theta) = x / radius		

		data2D.push([x_outer, y_outer], [x_inner, y_inner]);	//[x,y] add to array of points
	}	

	//connect in series to form triangles

	return data2D;
}


function generateTriangle(side_1, side_2, side_3, orientation) {
	//place center of triangle at centroid regardless of triangle design type


	return data2D;
}



//generate square structure class
function generateRectangle(side_1, side_2, orientation) {
	//place center of rectangle and centroid

	var data2D = [];

	data2D.push([side_1/2,side_2/2]);
	data2D.push([-side_1/2,side_2/2]);
	data2D.push([-side_1/2,-side_2/2]);
	data2D.push([side_1/2,-side_2/2]);

	//put in rotational transform here on the array

	return data2D;
}



//generate 3 dimensional objects
function generateExtrude(data2D, distance, orientation) {	//generate extrusion along an axis from 2d primitive shape

	var data3D = [];
	//calculate the projection of data2D at orientation over distance


	//append new points to 

	return data3D;
}

function generateSweep(args)  {		//generate sweep of primitive shape along path defined 

	return data3D;
}


function generateSweepAxis(args) {	//generate a revolved sweep about an axis from 2d primitive shape


	return data3D;
}


function transformRotation(args) {


}


function transformTranslation(args) {


}


function transformScale(args){


}

function mirror(args) {


}

function patternLinear(args) {


}

function patternAngular(args) {


}