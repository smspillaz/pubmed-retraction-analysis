var w = 100,
    h = 100
;

//Dummy Values
var continentYear = [5, 5, 10, 15, 20];
var countryYear = [10, 5, 15, 30, 10];
var journalYear = [5, 10, 3, 20, 15];


// config, add svg
var canvas = d3.select('body')
    .append('svg')
    .attr('width',500)
    .attr('height',100)
    .append('g');


// d3 update pattern -bind, add, update, remove-
function updateGraph(newData) {

    // bind 
    var appending = canvas.selectAll('rect')
       .data(newData);
    console.log(newData);

    var x = d3.scale.linear()
              .domain([0, d3.max(newData)])
              .range([0, 420]);

    // update 
    appending.transition()
             .duration(0);

    d3.select(".chart")
      .selectAll("div")
      .data(newData)
      .enter().append("div")
              .style("width", function(d) {
                  return x(d) + "px";
              })
      .text(function(d) {
                return d;
            });
        
    // remove
    //not working....
    appending.exit().remove();
    console.log("removed?");

}

//Load initial option journal/year ATM
updateGraph(journalYear);

// updates graph 
function updateSelection() {
    //make function to remove before every update
    console.log('updating ....');
    var x = document.getElementById("graphs").value;
    console.log(x);
    updateGraph(x); //adding string rather than selection and doesnt remove old selections 
    console.log("here");
}
