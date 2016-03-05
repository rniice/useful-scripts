var gpio = require("gpio");
var Repeat = require('repeat');
var detect_beat = require('./detect_beat.js');

var gpios_used = [2, 3, 4, 17, 27, 22];
var gpios_used_mapped = [0, 1, 2, 3, 4, 5];
var period = 200;

var invert_output = true;		//for some reason my standard state for gpios is on.  e.g. reverse mapping


var gpios_initialized = initializeOutputGPIOs(gpios_used, 100);		//initialize as outputs with 100ms sample interval

detect_beat.detectBeatRanges();




/////////TOP-LEVEL FUNCTIONS ORCHESTRATING LIGHTS////////////////


/*
setTimeout(function(){
	subtask2();		//make sure all are set low
},5000);

Repeat(task).every(period, 'ms').for(2, 'minutes').start.in(8, 'sec');
*/

//once gpios are all initialized the main loop is called
function mainLoop(){
	Repeat(task).every(period, 'ms').for(2, 'minutes').start.in(3, 'sec');
	// -> Now wait for 1 seconds and keep a watchful eye on the javascript console
}

//---task group functions----//
function task() {
	subtask5();
}

function subtask1(){
	setGPIOsHigh(gpios_used_mapped);
}

function subtask2(){
	setGPIOsLow(gpios_used_mapped);
}

function subtask3(){
	setTimeout(function(){
		sweepHigh(period/2, 6);				//sweep through all 6 relays, total duration takes 6 seconds.
	}, period/2);
}

function subtask4(){
	setTimeout(function(){
		sweepLow(period/2, 6);				//sweep through all 6 relays, total duration takes 6 seconds.
	}, period/2);
}

function subtask5(){
	sweepHigh(period/2, 6);				//sweep through all 6 relays, total duration takes 6 seconds.
	setTimeout(function(){
		sweepLow(period/2, 6);				//sweep through all 6 relays, total duration takes 6 seconds.
	}, period/2);
}


function delay(func, delay_amt) {	//delay amt in milliseconds
	setTimeout(function(){
		func();
	}, delay_amt)
}


////////////RELAY CONTROL FUNCTIONS///////////////

function initializeOutputGPIOs (gpios_used, sample_interval) {
	var gpios_initialized = [];

	if (gpios_used.length > 1){
		for (var item in gpios_used) {
			var instance = createOutputGPIO(gpios_used[item], sample_interval);  //create gpio instance object
			gpios_initialized.push(instance);										  //add it to the gpios_initialized array
			console.log("Creating Output GPIO:    " + gpios_used[item]);
		}
	}

	else {
		var instance = createOutputGPIO(gpios_used, 'out', sample_interval);  //create gpio instance object
		gpios_initialized.push(instance);										  //add it to the gpios_initialized array
		console.log("Creating Output GPIO:    " + gpios_used);
	}

	return gpios_initialized;
}


function initializeInputGPIOs (gpios_used) {
	/*
	var gpios_initialized = [];

	if (gpios_used.length > 1){
		for (var item in gpios_used) {
			var instance = createOutputGPIO(gpios_used[item], sample_interval);  //create gpio instance object
			gpios_initialized.push(instance);										  //add it to the gpios_initialized array
			console.log("Creating Output GPIO:    " + gpios_used[item]);
		}
	}

	else {
		var instance = createOutputGPIO(gpios_used, 'out', sample_interval);  //create gpio instance object
		gpios_initialized.push(instance);										  //add it to the gpios_initialized array
		console.log("Creating Output GPIO:    " + gpios_used);
	}

	return gpios_initialized;
	*/
}


function createOutputGPIO (gpio_num, sample_interval) {
	var gpio_instance = gpio.export(gpio_num, {
		direction: 'out',
		interval: sample_interval,
		ready: function () {			
		
			write(gpio_instance, false);	//when inverted, set will instead act as LOW
		
		}
	});

	return gpio_instance;
}


function createInputGPIO (gpio_num) {
	var gpio_instance = gpio.export(gpio_num, {
		direction: "in",
		ready: function() {
			console.log("in ready callback of createInputGPIO");
		}
	});

	return gpio_instance;
	//use event emitter to detect changes on gpio.
}


function sweepHigh(total_duration, relays_used){
	var total_relays = relays_used;
	var time_per_relay = total_duration/total_relays;

	var current_relay = 0;		//initialize at the first relay (numbered 0 through total specified)
	var current_time = 0;		//initialize the current time

	var interval = setInterval(function(){
		this.setGPIOsHigh(current_relay);

		current_relay += 1;
		current_time += time_per_relay;

		if( current_time>(total_duration-time_per_relay) ) {	//stop execution before last nonexisten relay
			clearInterval(interval);
		}

	}, time_per_relay);
}


function sweepLow(total_duration, relays_used){
	var total_relays = relays_used;
	var time_per_relay = total_duration/total_relays;

	var current_relay = 0;		//initialize at the first relay (numbered 0 through total specified)
	var current_time = 0;		//initialize the current time

	var interval = setInterval(function(){
		this.setGPIOsLow(current_relay);

		current_relay += 1;
		current_time += time_per_relay;

		if( current_time>(total_duration-time_per_relay) ) {	//stop execution before last nonexisten relay
			clearInterval(interval);
		}

	}, time_per_relay);
}


function setGPIOsHigh(gpios_selected){			//will take an array of 1 or more pins to turn on
	if (gpios_selected.length > 1){
		for (item in gpios_selected) {
			var value = gpios_selected[item];

			//console.log("GPIO SET HIGH:    " + gpios_used[value]);
			write(gpios_initialized[value], true);
		}
	}
	else {
		var value = gpios_selected;

		//console.log("GPIO SET HIGH:    " + gpios_used[value]);
		write(gpios_initialized[value], true);
	}
}


function setGPIOsLow(gpios_selected) {			//will take an array of 1 or more pins to turn off
	if (gpios_selected.length > 1){
		for (item in gpios_selected) {
			var value = gpios_selected[item];

			//console.log("GPIO SET LOW:     " + gpios_used[value]);
			write(gpios_initialized[item], false);
		}
	}
	else {
		var value = gpios_selected;

		//console.log("GPIO SET LOW:     " + gpios_used[value]);
		write(gpios_initialized[gpios_selected], false);
	}
}


function write(gpio_instance, value) {				//gpio_instance is the GPIO # the OS defines
   	if (invert_output) {							//invert the input selected if invert is selected
   		console.log("value in is: " + value);
   		value = !value;
   	}

   	if(value === true) {
   		console.log("value out is: " + value);
   		console.log("GPIO SET HIGH");
   		gpio_instance.set();
	}
	else if(value === false) {
  		console.log("value out is: " + value);
		console.log("GPIO SET LOW");
   		gpio_instance.reset();
	}
	else {
		console.log("value not accepted");
	}
}


function read(gpio_instance) {


}


module.exports = {
	setGPIOsHigh: setGPIOsHigh,
	setGPIOsLow: setGPIOsLow
}