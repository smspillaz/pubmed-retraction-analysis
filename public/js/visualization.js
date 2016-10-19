/* global bundle, $ */

var vis = require("vis");

/**
 * updateGraph
 *
 * Update the graph with some new data and remove the old one.
 *
 * @newData: New tuples of data to update the graph with
 */
function updateVisualization(newData) {
  var svg;
  var chartContainer = document.getElementsByClassName("chart")[0];

  var nodes = new vis.DataSet(newData.nodes);
  var edges = new vis.DataSet(newData.edges);

  var network = new vis.Network(chartContainer, { nodes: nodes, edges: edges }, {});
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
function postGraphUpdateRequest(filterString, filterType) {
  if (!filterString || !filterString.length) {
    $("#incorrectInputAlert").html("You need to specify a search term");
    $("#incorrectInputAlert").attr("style", "");
    return;
  }

  $("#incorrectInputAlert").attr("style", "visibility: hidden;");
  $.ajax({
    url: "/visualization/get_visualisation",
    data: {
      filterString: filterString || null,
      filterType: filterType || null
    },
    success: function onXHRSuccess(data) {
      updateVisualization(data.data);
    }
  });
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

    postGraphUpdateRequest($("#visualizeFilterInput").val(),
                           $("#filterSelectionDropdown").attr("selection"));
    return false;
  });
}

document.addEventListener("DOMContentLoaded", function onDOMLoaded() {
  listenForUserInteraction("#filterSelectionDropdown",
                           "#filterSelectionMenu");
  $("#visualizeFilterInput").keypress(function onKeyPress(event) {
    var keyCode = event.keyCode || event.which;
    if (keyCode === 13) {
      /* User pressed enter, respond accordingly */
      postGraphUpdateRequest($("#visualizeFilterInput").val(),
                             $("#filterSelectionDropdown").attr("selection"));
    }
  });
});
