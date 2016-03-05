var gpio = require("gpio");


////////////RELAY CONTROL FUNCTIONS///////////////
function GPIOS (gpios_used, gpios_used_mapped, invert_output, sample_interval) {
	this.gpios_used = gpios_used;
	this.gpios_used_mapped = gpios_used_mapped;
	this.invert_output = invert_output;
	this.sample_interval;									//currently all GPIOs set to same sample interval, but this can vary

	this.gpios_initialized =[];
}


GPIOS.prototype.initializeOutputGPIOs = function () {
	if (gpios_used.length > 1){
		for (var item in gpios_used) {
			var instance = this.createOutputGPIO(gpios_used[item]);  //create gpio instance object
			gpios_initialized.push(instance);										  //add it to the gpios_initialized array
			console.log("Creating Output GPIO:    " + gpios_used[item]);
		}
	}

	else {
		var instance = this.createOutputGPIO(gpios_used);  //create gpio instance object
		gpios_initialized.push(instance);										  //add it to the gpios_initialized array
		console.log("Creating Output GPIO:    " + gpios_used);
	}
}


GPIOS.prototype.initializeInputGPIOs = function (gpios_used) {
	//NOT IMPLEMENTED YET

}


GPIOS.prototype.createOutputGPIO = function (gpio_num) {
	var gpio_instance = gpio.export(gpio_num, {
		direction: 'out',
		interval: sample_interval,
		ready: function () {			
			write(gpio_instance, false);	//initialize at known state. when inverted, set will instead act as LOW
		}
	});

	return gpio_instance;
}


GPIOS.prototype.createInputGPIO = function(gpio_num) {
	var gpio_instance = gpio.export(gpio_num, {
		direction: "in",
		//interval: this.sample_interval,
		ready: function() {
			console.log("in ready callback of createInputGPIO");
		}
	});

	return gpio_instance;
	//use event emitter to detect changes on gpio.
}


GPIOS.prototype.sweepHigh = function (total_duration, relays_used){
	var total_relays = relays_used;
	var time_per_relay = total_duration/total_relays;

	var current_relay = 0;		//initialize at the first relay (numbered 0 through total specified)
	var current_time = 0;		//initialize the current time

	var interval = setInterval(function(){
		setGPIOsHigh(current_relay);

		current_relay += 1;
		current_time += time_per_relay;

		if( current_time>(total_duration-time_per_relay) ) {	//stop execution before last nonexisten relay
			clearInterval(interval);
		}

	}, time_per_relay);
}


GPIOS.prototype.sweepLow = function (total_duration, relays_used){
	var total_relays = relays_used;
	var time_per_relay = total_duration/total_relays;

	var current_relay = 0;		//initialize at the first relay (numbered 0 through total specified)
	var current_time = 0;		//initialize the current time

	var interval = setInterval(function(){
		setGPIOsLow(current_relay);

		current_relay += 1;
		current_time += time_per_relay;

		if( current_time>(total_duration-time_per_relay) ) {	//stop execution before last nonexisten relay
			clearInterval(interval);
		}

	}, time_per_relay);
}


GPIOS.prototype.setGPIOsHigh = function	(gpios_selected){			//will take an array of 1 or more pins to turn on
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


GPIOS.prototype.setGPIOsLow = function (gpios_selected) {			//will take an array of 1 or more pins to turn off
	if (gpios_selected.length > 1){
		for (item in gpios_selected) {
			var value = gpios_selected[item];
			//console.log("GPIO SET LOW:     " + gpios_used[value]);
			write(this.gpios_initialized[value], false);
		}
	}
	else {
		var value = gpios_selected;
		//console.log("GPIO SET LOW:     " + gpios_used[value]);
		write(this.gpios_initialized[value], false);
	}
}


GPIOS.prototype.write = function (gpio_instance, value) {				//gpio_instance is the GPIO # the OS defines
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


GPIOS.prototype.read = function (gpio_instance) {
	//NOT IMPLEMENTED YET

}


module.exports = GPIOS;