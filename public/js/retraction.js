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
 * drawBarForDataPoint
 */
function drawBarForDataPoint(svg, dataPoint, index, length, offsetAmount, dataMax) {
  var computeTextY = function computeTextY() {
    var chartHeight = this.parentNode.parentNode.clientHeight;
    var barSpacing = 10;
    var textHeight = 15;
    return (((chartHeight - (barSpacing * length)) /
            length) / 2) + (textHeight / 2);
  };
  var computeBarWidth = function computeBarWidth() {
    var parentWidth = (this.parentNode.parentNode.clientWidth -
                       offsetAmount);
    var x = d3.scaleLinear().domain([0, dataMax])
                            .range([0, parentWidth]);
    return x(dataPoint.value);
  };
  var g = svg.append("g")
             .attr("transform", function computeBarY() {
               var chartHeight = this.parentNode.clientHeight;
               var barSpacing = 10;
               var barHeight = ((chartHeight - (barSpacing *
                                                length)) /
                                length);

               var y = (index * barSpacing) + (index * barHeight);
               return "translate(0.0, " + y + ")";
             });
  g.append("rect")
   .attr("height", function computeBarHeight() {
     var chartHeight = this.parentNode.parentNode.clientHeight;
     var barSpacing = 10;
     return ((chartHeight - (barSpacing * length)) /
             length);
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
   .attr("fill", "#000000")
   .text(dataPoint.name)
   .attr("y", computeTextY)
   .attr("x", 10);
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
}

/**
 * drawBarChart
 *
 * Draws a bar chart using data on the given node.
 *
 * @data {array} - The data to use to draw the chart
 * @chartContainer {object} - The containing element for this chart
 * @returns {object} - The completed node
 */
function drawBarChart(data, chartContainer) {
  /* The individual points of data, not including labels */
  var dataPoints = data.map(function onEachDataPoint(w) {
    return w.value;
  });

  var svg = d3.select("div.chart")
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

  /* Estimated sizes of the labels and the bars if no scaling was applied -
   * use this to determine whether an offset should be applied to the chart
   * based on the width of the smallest bar and its corresponding label. If
   * a bar's label size exceeds the size of the bar, we need to make
   * at least enough room on the left hand side for the bar label */
  var offsetAmount = 0;
  var postprocessedData = data.map(function onEachDataPoint(d) {
    var availableParentWidth = chartContainer.clientWidth * 0.80;
    var x = d3.scaleLinear().domain([0, d3.max(dataPoints)])
                            .range([0, availableParentWidth]);
    var bar = x(d.value);
    var label = 10 + (INDIVIDUAL_CHARACTER_SIZE * d.name.length);

    if (offsetAmount < label) {
      offsetAmount = label;
    }

    return {
      name: d.name,
      value: d.value
    };
  });

  var dataMax = d3.max(dataPoints);
  postprocessedData.forEach(function forEachDataPoint(dataPoint, index) {
    drawBarForDataPoint(svg, dataPoint, index, postprocessedData.length, offsetAmount, dataMax);
  });

  return svg;
}

/**
 * drawLineChart
 *
 * Draws a line chart using hte data on the given node.
 *
 * @svg {object} - An svg node to draw the bar chart on
 * @data {array} = The data to use to draw the chart
 * @chartContainer {object} - The containing element for this chart
 * @returns {object} - The completed node
 */
function drawLineChart(data, chartContainer) {
  var dataset = data.map(function onEachDataPoint(d) {
    return {
      year: Number(d.name),
      retractions: d.value,
      name: "Retractions"
    };
  });

  return new d3plus.viz()
                   .container(".chart")
                   .data(dataset)
                   .type("line")
                   .id("name")
                   .text("name")
                   .y("retractions")
                   .x("year")
                   .draw();
}

var DrawChartDispatch = {
  countryRetraction: drawBarChart,
  authorRetraction: drawBarChart,
  topicRetraction: drawBarChart,
  retractionsOverTime: drawLineChart
};

/**
 * updateGraph
 *
 * Update the graph with some new data and remove the old one.
 *
 * @newData: New tuples of data to update the graph with
 */
function updateGraph(newData, name) {
  var chartContainer = document.getElementsByClassName("chart")[0];

  /* Drop any existing SVG elements */
  Array.prototype.forEach.call(document.getElementsByClassName("chart"),
                               function dropInnerHTMLOf(element) {
                                 /* Drop everything inside this chart */
                                 element.innerHTML = "";  // eslint-disable-line no-param-reassign
                               });

  DrawChartDispatch[name](newData, chartContainer);
}

/**
 * postGraphUpdateRequest
 *
 * Post a request to the server to get a new graph.
 *
 * @name The chart name to fetch.
 * @filter A filter string
 # @filterType What to filter on
 */
function postGraphUpdateRequest(name, filterString, filterType) {
  if (!name) {
    $("#incorrectInputAlert").html("You need to specify a chart type to display");
    $("#incorrectInputAlert").attr("style", "");
    return;
  }

  if (filterString && (!filterType || filterType === "none")) {
    $("#incorrectInputAlert").html("You need to specify what to search on");
    $("#incorrectInputAlert").attr("style", "");
    return;
  }

  $("#incorrectInputAlert").attr("style", "visibility: hidden;");

  if (name) {
    $.ajax({
      url: "/get_bar_chart",
      data: {
        name: name,
        filterString: filterString || null,
        filterType: filterType || null
      },
      success: function onXHRSuccess(data) {
        updateGraph(data.data, name);
      }
    });
  }
}

/**
 * listenForUserInteraction
 *
 * For a dropdown menu id and a it's contents' id, listen for
 * click events and then post an update request to fetch a graph.
 */
function listenForUserInteraction(dropdownSelector, menuSelector) {
  $(menuSelector + " li a").click(function onDropdownClick(event) {
    var button = $(dropdownSelector);
    var parentDiv = $(".open");

    button.html(this.text + " <span class='caret'></span>");
    button.attr("selection", $(this).attr("data-selection-id"));
    parentDiv.removeClass("open");
    event.preventDefault();

    postGraphUpdateRequest($("#chartSelectionDropdown").attr("selection"),
                           $("#chartFilterInput").val(),
                           $("#filterSelectionDropdown").attr("selection"));
    return false;
  });
}

document.addEventListener("DOMContentLoaded", function onDOMLoaded() {
  listenForUserInteraction("#chartSelectionDropdown", "#chartSelectionMenu");
  listenForUserInteraction("#filterSelectionDropdown",
                           "#filterSelectionMenu");
  $("#chartFilterInput").keypress(function onKeyPress(event) {
    var keyCode = event.keyCode || event.which;
    if (keyCode === 13) {
      /* User pressed enter, respond accordingly */
      postGraphUpdateRequest($("#chartSelectionDropdown").attr("selection"),
                             $("#chartFilterInput").val(),
                             $("#filterSelectionDropdown").attr("selection"));
    }
  });
});
