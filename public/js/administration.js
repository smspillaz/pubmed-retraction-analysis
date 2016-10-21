document.addEventListener("DOMContentLoaded", function onDOMContentLoaded() {
  var isCrawlingRequest = new XMLHttpRequest();
  isCrawlingRequest.addEventListener("load", function onGotIsCrawling() {
        /* This is horrible, but it is something to do with the way express
         * encodes responses */
    document.getElementById("crawlingStatus").innerText = JSON.parse(JSON.parse(this.responseText).data).crawling ? "Started" : "Stopped";
  });
  isCrawlingRequest.open("GET", "/administration/is_crawling");
  isCrawlingRequest.send();

  document.getElementById("crawlerButton").addEventListener("click", function onPress() {
    var crawlRequest = new XMLHttpRequest();
    crawlRequest.addEventListener("load", function onDoneStartCrawling() {
      if (JSON.parse(this.responseText).status === "success") {
        document.getElementById("crawlingStatus").innerText = "Started";
      }
    });
    crawlRequest.open("POST", "/administration/start_crawling");
    crawlRequest.send();
  });
});
