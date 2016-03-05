var linearAlgebra = require('linear-algebra')({add: require('add')}),     // initialise it with higher precision
    Vector = linearAlgebra.Vector,
    Matrix = linearAlgebra.Matrix;


var m = new Matrix([ [1, 2, 3], [4, 5, 6] ]);
 
// default 
var m2 = m.mulEach(5);   // multiply every element by 5 
m2 === m1;  // false 
 
// in-place 
var m2 = m.mulEach_(5); // notice the _ suffix 
m2 === m1;  // true 




/*
var m, m2, m3;  // variables we'll use below 
 
/* Construction */
 
m = new Matrix([ [1, 2, 3], [4, 5, 6] ]);
console.log( m.rows );     // 2 
console.log( m.cols );     // 3 
console.log( m.data );     // [ [1, 2, 3], [4, 5, 6] ] 
 
// identity matrix 
m = Matrix.identity(3);
console.log( m.data );     // [ [1,0,0], [0,1,0], [0,0,1] ] 
 
// scalar (diagonal) matrix 
m = Matrix.scalar(3, 9);
console.log( m.data );     // [ [9,0,0], [0,9,0], [0,0,9] ] 
 
// vector (a 1-row matrix) 
m = Vector.zero(5);
console.log( m.data );     // [ [0, 0, 0, 0, 0] ] 
 
 
/* Algebra */
 
// transpose 
m = new Matrix([ [1, 2, 3], [4, 5, 6] ]);
m2 = m.trans();
console.log(m2.data);    // [ [1, 4], [2, 5], [3, 6] ] 
 
// dot-product 
m = new Matrix([ [1, 2, 3], [4, 5, 6] ]);
m2 = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
m3 = m.dot(m2);
console.log(m3.data);    // [ [22, 28], [49, 64] ] 
 
// multiply corresponding elements 
m = new Matrix([ [10, 20], [30, 40], [50, 60] ]);
m2 = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
m3 = m.mul(m2);
console.log(m3.data);    // [ [10, 40], [90, 160], [250, 360] ] 
 
// divide corresponding elements 
m = new Matrix([ [10, 20], [30, 40], [50, 60] ]);
m2 = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
m3 = m.div(m2);
console.log(m3.data);    // [ [10, 10], [10, 10], [10, 10] ] 
 
// add corresponding elements 
m = new Matrix([ [10, 20], [30, 40], [50, 60] ]);
m2 = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
m3 = m.plus(m2);
console.log(m3.data);    // [ [11, 22], [33, 44], [55, 66] ] 
 
// subtract corresponding elements 
m = new Matrix([ [10, 20], [30, 40], [50, 60] ]);
m2 = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
m3 = m.minus(m2);
console.log(m3.data);    // [ [9, 18], [27, 36], [45, 54] ] 
 
 
/* Math functions
 
// natural log (Math.log) 
m = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
m2 = m.log();
console.log(m2.data);    // [ [0.0000, 0.69315], [1.09861, 1.38629], [1.60944   1.79176] ] 
 
// sigmoid 
m = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
m2 = m.sigmoid();
console.log(m2.data);    // [ [0.73106, 0.88080], [0.95257, 0.98201], [0.99331, 0.99753] ] 
 
// add value to each element 
m = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
m2 = m.plusEach(5);
console.log(m2.data);    // [ [6, 7], [8, 9], [10, 11] ] 
 
// multiply each element by value 
m = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
m2 = m.mulEach(5);
console.log(m2.data);    // [ [5, 10], [15, 20], [25, 30] ] 
 
// any function 
m = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
m2 = m.map(function(v) {
    return v - 1;    
});
console.log(m2.data);    // [ [0, 1], [2, 3], [4, 5] ] 
 

/* Calculations */
 
// sum all elements 
m = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
console.log(m.getSum());    // 21 
 
 
/* Other methods */
 
// cloning 
m = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
m2 = m.clone();
console.log( m2.data ); // [ [1, 2], [3, 4], [5, 6] ] 
 
// to plain array 
m = new Matrix([ [1, 2], [3, 4], [5, 6] ]);
m2 = m.toArray();
console.log( m2 ); // [ [1, 2], [3, 4], [5, 6] ] 
/*

*/



