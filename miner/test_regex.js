var data = "asdfsaldkfjsld dog aldskfj;laskdjf;l kjslad dog dlakjfl;askjdflaskjd;flkasjdlfkjsa;ld";
var regexp = /dog/gi;

var count = data.match(regexp).length;

console.log(count);