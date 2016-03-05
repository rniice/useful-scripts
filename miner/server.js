var Search = require('./Search');
//var regexp = require('node-regexp');

var search = new Search();						//create a local instance of Search class


//DATA USED TO RUN SEARCH
var search_option = "find_instances";
var base_url = "http://en.wikipedia.org/wiki/";
var regex = /dog/g;
//console.log("regex is: " + regex);

//SETTINGS TO USE
var total_requests = 200;
var simultaneous_requests = 40;



var total_requests_completed = 0;
var active_requests = 0;

console.log("url , matches")


//RUN THE SEARCH PLAN
Search.loadRequests(simultaneous_requests);

