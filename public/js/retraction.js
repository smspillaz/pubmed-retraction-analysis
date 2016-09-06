var w = 100,
    h = 100
;

// updates graph
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

function postGraphUpdateRequest(name) {
    $.ajax({
        url: '/get_bar_chart',
        data: {
            name: name
        },
        success: function(data, status, xhr) {
            updateGraph(data.data.map(function(w) {
                return w.value;
            }));
        }
    });
}


function updateSelection(name) {
    postGraphUpdateRequest(document.getElementById("graphs").value);
}

document.addEventListener("DOMContentLoaded", function() {
    updateSelection("journalYear");
});