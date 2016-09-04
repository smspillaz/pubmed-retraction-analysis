var w = 100,
    h = 100
;

//Dummy Values
var values = {
    continentYear: [5, 5, 10, 15, 20],
    countryYear: [10, 5, 15, 30, 10],
    journalYear: [5, 10, 3, 20, 15]
};


// d3 update pattern -bind, add, update, remove-
function updateGraph(newData) {

    var x = d3.scale.linear()
              .domain([0, d3.max(newData)])
              .range([0, 420]);

    /* Drop any existing SVG elements */
    Array.prototype.forEach.call(document.getElementsByClassName("chart"), function(element) {
        /* Drop everything inside this chart */
        element.innerHTML = "";
    });

    var svg = d3.select("div.chart")
                .append("svg")
                .attr("class", "svgchart")
                .attr("width", 960)
                .attr("height", 500);

    var rects = svg.selectAll("rect")
       .data(newData)
       .enter()
       .append("rect");

    rects.attr("width", function(d) {
             return x(d);
          })
          .attr("height", 20)
          .attr("y", function(d, i) {
            return 30 * i;
          });
}

// updates graph 
function updateSelection() {
    //make function to remove before every update
    var x = document.getElementById("graphs").value;
    updateGraph(values[x]); //adding string rather than selection and doesnt remove old selections 
}

document.addEventListener("DOMContentLoaded", function() {
  updateSelection(values.journalYear);
});