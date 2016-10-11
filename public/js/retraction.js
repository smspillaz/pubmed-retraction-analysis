/* global bundle, $ */

var d3 = require("d3");

var COLOR_TABLE = [
  "#C8D2D9", "#97ABB8", "#FFBEB9", "#FFD1CE"
];

/* This is a poor-man's estimate, given the fact that measuring the
 * actual size of the characters (accounting for kerning) will involve
 * significant DOM mutation. */
var INDIVIDUAL_CHARACTER_SIZE = 10;

/**
 * calculateChartOffset

/**
 * updateGraph
 *
 * Update the graph with some new data and remove the old one.
 *
 * @newData: New tuples of data to update the graph with
 */
function updateGraph(newData) {
  var svg;
  var chartContainer = document.getElementsByClassName("chart")[0];

  /* The individual points of data, not including labels */
  var dataPoints = newData.map(function onEachDataPoint(w) {
    return w.value;
  });

  /* Estimated sizes of the labels and the bars if no scaling was appleid -
   * use this to determine whether an offset should be applied to the chart
   * based on the width of the smallest bar and its corresponding label. If
   * a bar's label size exceeds the size of the bar, we need to make
   * at least enough room on the left hand side for the bar label */
  var offsetAmount = 0;
  var postprocessedData = newData.map(function onEachDataPoint(d) {
    var availableParentWidth = chartContainer.clientWidth * 0.80;
    var x = d3.scaleLinear().domain([0, d3.max(dataPoints)])
                            .range([0, availableParentWidth]);
    var bar = x(d.value);
    var label = 10 + (INDIVIDUAL_CHARACTER_SIZE * d.name.length);
    var isOffset = false;

    if (label > bar) {
      isOffset = true;
      if (offsetAmount < label) {
        offsetAmount = label;
      }
    }

    return {
      name: d.name,
      value: d.value,
      isOffset: isOffset
    };
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

  postprocessedData.forEach(function forEachDataPoint(dataPoint, index) {
    var computeTextY = function computeTextY() {
      var chartHeight = this.parentNode.parentNode.clientHeight;
      var barSpacing = 10;
      var textHeight = 15;
      return (((chartHeight - (barSpacing * postprocessedData.length)) /
              postprocessedData.length) / 2) + (textHeight / 2);
    };
    var computeBarWidth = function computeBarWidth() {
      var parentWidth = (this.parentNode.parentNode.clientWidth -
                         offsetAmount);
      var x = d3.scaleLinear().domain([0, d3.max(dataPoints)])
                              .range([0, parentWidth]);
      return x(dataPoint.value);
    };
    var g = svg.append("g")
               .attr("transform", function computeBarY() {
                 var chartHeight = this.parentNode.clientHeight;
                 var barSpacing = 10;
                 var barHeight = ((chartHeight - (barSpacing *
                                                  postprocessedData.length)) /
                                  postprocessedData.length);

                 var y = (index * barSpacing) + (index * barHeight);
                 return "translate(0.0, " + y + ")";
               });
    g.append("rect")
     .attr("height", function computeBarHeight() {
       var chartHeight = this.parentNode.parentNode.clientHeight;
       var barSpacing = 10;
       return ((chartHeight - (barSpacing * postprocessedData.length)) /
               postprocessedData.length);
     })
     .transition()
     .delay(index * 50)
     .duration(750)
     .ease(d3.easeElastic.period(0.4))
     .attr("width", computeBarWidth)
     .attr("rx", "15")
     .attr("ry", "15")
     .attr("x", String(offsetAmount))
     .attr("fill", COLOR_TABLE[index % COLOR_TABLE.length]);
    g.append("text")
     .attr("fill", dataPoint.isOffset ? "#000000" : "#ffffff")
     .text(dataPoint.name)
     .attr("y", computeTextY)
     .attr("x", dataPoint.isOffset ? 10 : 10 + offsetAmount);
    g.append("text")
     .attr("fill", "#ffffff")
     .text(dataPoint.value)
     .attr("y", computeTextY)
     .transition()
     .delay(index * 50)
     .duration(750)
     .ease(d3.easeElastic.period(0.4))
     .attr("x", function computeNumberX() {
       var barWidth = computeBarWidth.call(this);
       var label = String(dataPoint.value);
       var labelSize = label.length * INDIVIDUAL_CHARACTER_SIZE;
       return (barWidth - labelSize) + offsetAmount;
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
