var AWS = require('aws-sdk'); 
var fs = require('fs');
var hb = require('handlebars');
var Hapi = require('hapi');
var Datastore = require('nedb')
  , db = new Datastore({ filename: './data', autoload : true });
var schedule = require('node-schedule');

// Schedule the new videos to be checked for every 5 minutes
var scheduled = schedule.scheduleJob('*/5 * * * *', function() {
  fetchNewObjects();
});

// Setup our hapi server
var server = new Hapi.Server();
server.connection({ port: 8000 });

// Read the files we need that never change
var index = fs.readFileSync('index.hbs').toString();
var template = hb.compile(index); 

// Handle AWS stuff
var s3 = new AWS.S3(); 
var bucket = 'bass-videos'
var baseUrl = 'https://s3-us-west-1.amazonaws.com/'



// This is ugly and I wish there was a better way.
function fetchNewObjects() {
  console.log("Fetching new objects");
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
        var day = entry[0];
        var artist = entry[1];
        var song = entry[2].replace(".mp4", "");
        var prettyKey = vid["Key"].replace(".mp4","");
        var url = baseUrl + bucket + '/' + key;
        //console.log(url);
        db.find({day: day}, function (err, docs) {
          if (docs.length === 0) {
            db.insert({ day: day, artist: artist, song: song, url: url });
          }
        });
      });
    }
  });
}

// Sort numerically by day
function compare(a,b) {
  if (a.day < b.day) 
    return -1;
  if (a.day > b.day)
    return 1
  return 0;
}

server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    db.find({}, function(err,videos) {
      videos.sort(compare);
      var html = template({videos: videos, test: JSON.stringify(videos)});
      reply(html)
    });
  }
});

server.route({ 
  method: 'GET',
  path: '/day/{day}',
  handler: function(request, reply) {
    var day = request.params.day;
    db.find({day: day}, function(err, videos) {
      if (videos.length > 0) {
        var html = template({videos: [videos[0]]});
        reply(html)
      } else {
        reply("No video found for that day.").code(404);
      }

    });
  }
});

server.start(function() {
  // Run the fetch on startup, so I can restart and get the videos immediately if need be.
  console.log('Server running at ', server.info.uri);
  fetchNewObjects()
});
