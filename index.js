var AWS = require('aws-sdk'); 
var fs = require('fs');
var hb = require('handlebars');
var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({ port: 8000 });

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

server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {

    var template = hb.compile(index); 
    var videoFile = fs.readFileSync('videos.json');
    var videos = JSON.parse(videoFile);
    var html = template({videos: videos});
    reply(html)
  }
});

server.start(function() {
  console.log('Server running at ', server.info.uri);
});
