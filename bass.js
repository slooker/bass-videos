var AWS = require('aws-sdk'); 
var http = require('http');
var fs = require('fs');
var hb = require('handlebars');

var index = fs.readFileSync('index.hbs').toString();


var s3 = new AWS.S3(); 
var bucket = 'bass-videos'
var baseUrl = 'https://s3-us-west-1.amazonaws.com/'
var videos = []

s3.listObjects({ Bucket: bucket }, function(err, data) {
  if (err) {
    console.log(err, err.stack); // an error occurred
  } else {
// successful response
 //console.log(data)
    var videoData = data["Contents"]
    videoData.forEach(function(vid) {
      var key = vid["Key"].replace(/ /g, "+");
      var prettyKey = vid["Key"].replace(".mp4","");
      var url = baseUrl + bucket + '/' + key;
      //console.log(url);
      videos.push( { key: prettyKey, url: url } );
    });
  }
  writeS3Data(videos);
});

function writeS3Data(videos) {
  fs.writeFile('videos.json', JSON.stringify(videos), function(err) {
    if (err) return console.log(err); 
    console.log(JSON.stringify(videos) + ' > videos.json');
  });
}


var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/html"});
  var template = hb.compile(index); 
  var videoFile = fs.readFileSync('videos.json');
  var videos = JSON.parse(videoFile);
  
//console.log(videoHash);
  var html = template({videos: videos});
  response.end(html);
}).listen(8000);
