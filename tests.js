var config = require('./config.js');
var page = require('webpage').create();

var site = config.server() + ':' + config.port() + '/#/'; // Weird react /#/

page.onResourceRequested = function (request) {
      //console.log('Request ' + JSON.stringify(request, undefined, 4));
      console.log('Request ' + request.url);
};

page.onError = function (msg, trace) {
  console.log(msg);
  trace.forEach(function(item) {
    console.log('  ', item.file, ':', item.line);
  });
};


page.open(site, function(status) {
  console.log("Status: "+status);
  if (status === "success") {
    var title = page.evaluate(function() {
      return document.title;
    });
    console.log("Page title: "+title);
//    window.setTimeout(function() {
      var links = page.evaluate(function() {
        return document.getElementsByTagName('a');
      });
      console.log("Link count: "+links.length);
      window.setTimeout(function() {
        page.render('currentPage.png');
        phantom.exit();
      }, 2000);
  }
});
