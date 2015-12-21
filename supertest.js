var page = require("webpage").create();  
var args = require('system').args;

//pass in the name of the file that contains your tests
var testFile = args[1];  
//pass in the url you are testing
var pageAddress = args[2];

if (typeof testFile === 'undefined') {  
    console.error("Did not specify a test file");
    phantom.exit();
}

page.open(pageAddress, function(status) {  
    if (status !== 'success') {
        console.error("Failed to open", page.frameUrl);
        phantom.exit();
    }

//Inject mocha and chai                               page.injectJs("../node_modules/mocha/mocha.js");
    page.injectJs("../node_modules/chai/chai.js");

    //inject your test reporter
    page.injectJs("mocha/reporter.js");

    //inject your tests
    page.injectJs("mocha/" + testFile);

    page.evaluate(function() {
        window.mocha.run();
    });
});

page.onCallback = function(data) {  
    data.message && console.log(data.message);
    data.exit && phantom.exit();
};

page.onConsoleMessage = function(msg, lineNum, sourceId) {  
  console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};
