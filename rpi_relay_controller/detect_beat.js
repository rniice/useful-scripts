var beatdetektor = require('./dependencies/beatdetektor/js/beatdetektor.js');


function detectBeatRanges(duration, fftdata){

	var bd_low = new beatdetektor.BeatDetektor(48,95);
	var bd_med = new beatdetektor.BeatDetektor(85,169);
	var bd_high = new beatdetektor.BeatDetektor(150,280);
	var vu = new beatdetektor.BeatDetektor.modules.vis.VU();
	var kick_det = new beatdetektor.BeatDetektor.modules.vis.BassKick();

	var dummyDataOne = new Array(1024);
	var dummyDataTwo = new Array(1024);


	// make two simulated buffers for creating a tick, make some random noise with a higher noise in buffer 2
	// actual FFT will work better because of proper rising/falling edges, some simulated BPM values will cause failure near BPM boundaries
	for (var i = 0; i < 1024; i++) 
	{
		if (i < 512)
		{
			dummyDataOne[i] = Math.floor(Math.random()*2.0);
			dummyDataTwo[i] = Math.floor(Math.random()*10.0);
		}
		else
		{
			dummyDataOne[i] = Math.floor(Math.random()*2.0);
			dummyDataTwo[i] = Math.floor(Math.random()*2.0);
		}
	}

	// simulate bpm
	var bpm_sim = 145.5;

	// simulate 60fps input
	var bdRate = 16;	
	var signal_rate = parseInt(((60.0/(bpm_sim))*1000.0));
	var signal_counter = 0;
	var total_calls = 0;

	console.log("Starting simulation of "+bpm_sim+" BPM.");

	// Simulate 1 minute
	for (var i = 0; i < 30000; i+=bdRate)
	{
		while (signal_counter>signal_rate) signal_counter-=signal_rate;
		bd_low.process((i / 1000.0),(signal_counter < signal_rate*0.1)?dummyDataTwo:dummyDataOne);
		bd_med.process((i / 1000.0),(signal_counter < signal_rate*0.2)?dummyDataTwo:dummyDataOne);
		bd_high.process((i / 1000.0),(signal_counter < signal_rate*0.5)?dummyDataTwo:dummyDataOne);
		
		// module test
		vu.process(bd_med);
		kick_det.process(bd_med);

		if (kick_det.isKick()){
			console.log("Kick @"+(i/1000.0));
		} 

		//console.log("VU @0"+(i/1000.0)+" = "+vu.getLevel(0));
		
		signal_counter+=bdRate;
		total_calls++;
	}

	//console.log("Total BeatDetektor.process() calls: "+total_calls);

	for (var i in bd_med.bpm_contest)
	{
		console.log(i+": "+bd_med.bpm_contest[i]);
		
	}

	console.log(bd_med.ma_bpm_range);
}

module.exports = {
	detectBeatRanges: detectBeatRanges
}
