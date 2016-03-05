var request = require('request');
var Q = require('q');

var randomWords = require('random-words');


function Search (name) {
	this._name = name;
	this._type = null;
	this._query = null;
	this._results = null;

	this._total_requests = null;
	this._simultaneous_requests = null;
	
	this._total_requests_completed = 0;
	this._active_requests = 0;
}


Search.prototype.testOutput = function(input){
	var deferred = Q.defer();

	deferred.resolve(input);
	
	return deferred.promise;
}


Search.prototype.findInstance = function (regexp, subject) {
	return regexp.test(subject);
}

Search.prototype.findNumInstances = function (regexp, subject) {
	var deferred = Q.defer();
	var matches = subject.match(regexp);

	if(matches) {
		deferred.resolve(matches.length);

	}
	else {
		deferred.resolve(0);
	}

	return deferred.promise;
}

Search.prototype.findPhoneNumber = function (regexp, subject) {
	return;
}

Search.prototype.findReplaceInstances = function (regexp, subject, replacement) {  //not implemented
	var deferred = Q.defer();

	var result = subject.replace(regexp, replacement);

	deferred.resolve(result);

	return deferred.promise;
}


Search.prototype.urlGenerator = function (base_url) { //not implemented
	var deferred = Q.defer();

	deferred.resolve(base_url.concat(randomWords()));
	return deferred.promise;
}


Search.prototype.getRequest = function (url) {
	var deferred = Q.defer();

	request
		.get(url)
			.on('error', function(err) {
				//console.log(err);
				deferred.resolve(" ");				//return nothing to search
			})
			.on('response', function(response){
				
				var data;								//temporary variable for body data
				
				response.on("data", function(chunk){	//retrieve all data from body
					data += chunk;
				});

				response.on("end", function(err) {		//after all data received parse data
					deferred.resolve(data);
				});
			});

	return deferred.promise;
}


Search.prototype.loadRequests = function(number) {
	var completed_requests = 0;

	for (var i = 0; i < number; i++) {
		this.urlGenerator(base_url).then(function(url){
			this.getRequest(url).then(function(data){
				this.findNumInstances(regex, data).then(function(matches){
					console.log(url + " , " + matches);
					completed_requests++;
					total_requests_completed++;
					console.log("total requests completed: " + total_requests_completed);
					if((completed_requests == simultaneous_requests)&&(total_requests_completed < total_requests)) {
						completed_requests = 0;		//reset to zero
						repeat(number);				//start another round of requests
					}
				});
			});
		});		
	}
}


Search.prototype.selectedSearch = function(search_option, args) {
	switch (search_option) {
		case find_num_instances:
			var matches = this.findNumInstances(regex, data); //do stuff
			break;

		case other:
			//do stuff
			break;

		default:
			//do stuff
			break;
	}
}


Search.prototype.repeat = function(num_requests) {
	this.loadRequests(num_requests);
}


module.exports = Search;