//create a Cat Instance
var cat = {
  firstName: "Kitty",
  lastName: "Kat",
  printFullName: function() {
    console.log("fullname is: " + this.firstName + " " + this.lastName);
  }
}

cat.printFullName();

//create a Dog Instance
var dog = {
  firstName: "Doggy",
  lastName: "Dog",
  printFullName: function() {
    console.log("fullname is: " + this.firstName + " " + this.lastName);
  }
}

dog.printFullName();

//create a mixup Object
var mixedupdata = {
  firstName: "WHOOPS",
  lastName: "ARHGH"
}

console.log("this is how to create the problem:");
var problem = cat.printFullName;
problem();  //call the problem function extracted from cat but now in global scope

console.log("this is how to create the solution using bind");
var solution = cat.printFullName.bind(cat);
solution();

console.log("this is how you get a mixup using bind");
var mixup = cat.printFullName.bind(mixedupdata);
mixup();
