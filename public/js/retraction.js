/* global bundle, $ */

/**
 * updateGraph
 *
 * Update the graph with some new data and remove the old one.
 *
 * @newData: New tuples of data to update the graph with
 */
function updateGraph(newData) {
  var svg;
  var rects;

  /* Drop any existing SVG elements */
  Array.prototype.forEach.call(document.getElementsByClassName("chart"),
                               function dropInnerHTMLOf(element) {
                                 /* Drop everything inside this chart */
                                 element.innerHTML = "";  // eslint-disable-line no-param-reassign
                               });

  svg = bundle.select("div.chart")
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

  rects = svg.selectAll("rect")
             .data(newData)
             .enter()
             .append("rect");

  rects.attr("width", function computeBarWidth(d) {
    var x = bundle.scaleLinear()
                 .domain([0, bundle.max(newData)])
                 .range([0, this.parentNode.clientWidth]);
    return x(d);
  })
  .attr("height", function computeBarHeight() {
    var chartHeight = this.parentNode.clientHeight;
    var barSpacing = 10;
    return (chartHeight - (barSpacing * newData.length)) / newData.length;
  })
  .attr("y", function computeBarY(d, i) {
    var chartHeight = this.parentNode.clientHeight;
    var barSpacing = 10;
    var barHeight = ((chartHeight - (barSpacing * newData.length)) /
                     newData.length);

    return (i * barSpacing) + (i * barHeight);
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
      updateGraph(data.data.map(function onEachPoint(w) {
        return w.value;
      }));
    }
  });
}

/**
 * updateSelection
 *
 * Get the new value from the graph selection and update the graph with it.
 */
function updateSelection() {
  postGraphUpdateRequest(document.getElementById("graphs").value);
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
