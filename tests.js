var config = require('./config.js');
var page = require('webpage').create();

var site = config.server() + ':' + config.port() + '/#/'; // Weird react /#/

page.open(site, function(status) {
  console.log("Status: "+status);
  if (status === "success") {
    var title = page.evaluate(function() {
      return document.title;
    });
    console.log('Page title is '+title);
    console.log("Setting timeout.");
    window.setTimeout(function() {
      console.log("Running page render.");
    //  page.render("currentPage.png");
    }, 2000);
  }
});

