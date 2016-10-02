/* global bundle, $ */

var d3 = require("d3");

var COLOR_TABLE = [
    "#C8D2D9", "#97ABB8", "#FFBEB9", "#FFD1CE"
];

/**
 * updateGraph
 *
 * Update the graph with some new data and remove the old one.
 *
 * @newData: New tuples of data to update the graph with
 */
function updateGraph(newData) {
  var svg;

  /* The individual points of data, not including labels */
  var dataPoints = newData.map(function onEachDataPoint(w) {
    return w.value;
  });

  /* Drop any existing SVG elements */
  Array.prototype.forEach.call(document.getElementsByClassName("chart"),
                               function dropInnerHTMLOf(element) {
                                 /* Drop everything inside this chart */
                                 element.innerHTML = "";  // eslint-disable-line no-param-reassign
                               });

  svg = d3.select("div.chart")
          .append("svg")
          .attr("class", "svgchart")
          .attr("width", function computeWidth() {
            return this.parentNode.clientWidth * 0.80;
          })
          .attr("height", function computeHeight() {
            return this.parentNode.clientHeight * 0.80;
          })
          .attr("style", function computeTransform() {
            var x = this.parentNode.clientWidth * 0.10;
            var y = this.parentNode.clientHeight * 0.10;
            return ["transform: translate(", x, "px,", y, "px", ")"].join("");
          });

  newData.map(function forEachDataPoint(dataPoint, index) {
    var g = svg.append("g")
               .attr("transform", function computeBarY(d) {
                 var chartHeight = this.parentNode.clientHeight;
                 var barSpacing = 10;
                 var barHeight = ((chartHeight - (barSpacing *
                                                  newData.length)) /
                                  newData.length);

                 var y = (index * barSpacing) + (index * barHeight);
                 return "translate(0.0, " + y + ")";
               });
    g.append("rect")
     .attr("height", function computeBarHeight() {
       var chartHeight = this.parentNode.parentNode.clientHeight;
       var barSpacing = 10;
       return ((chartHeight - (barSpacing * newData.length)) /
               newData.length);
     })
     .transition()
     .delay(index * 50)
     .duration(750)
     .ease(d3.easeElastic.period(0.4))
     .attr("width", function computeBarWidth() {
       var parentWidth = this.parentNode.parentNode.clientWidth;
       var x = d3.scaleLinear().domain([0, d3.max(dataPoints)])
                               .range([0, parentWidth]);
       return x(dataPoint.value);
     })
     .attr("rx", "15")
     .attr("ry", "15")
     .attr("fill", function() {
       return COLOR_TABLE[index % COLOR_TABLE.length];
     });
   g.append("text")
    .attr("fill", function() {
      return "#ffffff";
    })
    .text(function() {
      return dataPoint.name  ;
    })
    .attr("y", function() {
      var chartHeight = this.parentNode.parentNode.clientHeight;
      var barSpacing = 10;
      var textHeight = 15;
      return ((chartHeight - (barSpacing * newData.length)) /
              newData.length) / 2 + (textHeight / 2);
    })
    .attr("x", function() {
      return 10;
    });
  });
}

/**
 * postGraphUpdateRequest
 *
 * Post a request to the server to get a new graph.
 *
 * @name The chart name to fetch.
 */
function postGraphUpdateRequest(name) {
  $.ajax({
    url: "/get_bar_chart",
    data: {
      name: name
    },
    success: function onXHRSuccess(data) {
      updateGraph(data.data);
    }
  });
}

document.addEventListener("DOMContentLoaded", function onDOMLoaded() {
  $("#chartSelectionDropdown ul li a").click(function onDropdownClick(event) {
    var div = $(this).parent().parent().parent();
    var button = div.find("button");

    button.html(this.text + " <span class='caret'></span>");
    div.removeClass("open");
    event.preventDefault();

    postGraphUpdateRequest($(this).attr("data-selection-id"));
    return false;
  });
});
