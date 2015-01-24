var AWS = require('aws-sdk'); 
var http = require('http');
var fs = require('fs');
var hb = require('handlebars');

var ROW_WIDTH = 3;
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
      var entry = vid["Key"].split(" - ");
      var day = "Day "+entry[0];
      var artist = entry[1];
      var song = entry[2].replace(".mp4", "");
console.log("Day: "+day+", artist: "+artist+", song: "+song);
      var prettyKey = vid["Key"].replace(".mp4","");
      var url = baseUrl + bucket + '/' + key;
      //console.log(url);
      videos.push( { key: prettyKey, url: url, song: song, day: day, artist: artist } );
    });
  }
  writeS3Data(videos);
});

// Transform an array into a 2d array X rows wide.
function transform ( arr ) {
  var result = [], temp = [];
  arr.forEach( function ( elem, i ) {
    if ( i > 0 && i % ROW_WIDTH === 0 ) {
      result.push( temp );
      temp = [];
    }
    temp.push( elem );
  });
  if ( temp.length > 0 ) {
    result.push( temp );
  }
  return result;
}

function writeS3Data(videos) {
  videos = transform(videos);
  fs.writeFile('videos.json', JSON.stringify(videos), function(err) {
    if (err) return console.log(err); 
    //console.log(JSON.stringify(videos) + ' > videos.json');
  });
}


var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/html"});
  var template = hb.compile(index); 
  var videoFile = fs.readFileSync('videos.json');
  var videos = JSON.parse(videoFile);

  //console.log(videos);
  var html = template({videos: videos});
  response.end(html);
}).listen(8000);
