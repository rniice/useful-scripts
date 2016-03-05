var util = require("util"),
my_http = require("http"),
path = require("path"),
url = require("url"),
fs = require("fs");

var arduino = require('duino'), 
	board = new arduino.Board();

var led = new arduino.Led({
	board: board,
	pin: 18
});

//led.blink();


my_http.createServer(function(request,response){
	var my_path = url.parse(request.url).pathname;
	var full_path = path.join(process.cwd(),my_path);
	console.log("the full_path is: " + full_path);
	fs.exists(full_path,function(exists){
		if(!exists){
			response.writeHeader(404, {"Content-Type": "text/plain"});  
			response.write("404 Not Found\n");  
			response.end();
			console.log("serving up page now");
		}
		else{
			fs.readFile(full_path, "binary", function(err, file) {  
			     if(err) {  
			         response.writeHeader(500, {"Content-Type": "text/plain"});  
			         response.write(err + "\n");  
			         response.end();  
			   
			     }  
				 else{
					response.writeHeader(200);  
			        response.write(file, "binary");  
			        response.end();
				}
					 
			});
		}
	});
}).listen(8080);
console.log("server running on 8080");

/*my_http.createServer(function(request,response){
	//var my_path = url.parse(request.url).pathname;
	console.log(my_path);
	load_file(my_path,response);
}).listen(8080);
util.puts("Server Running on 8080");			
*/