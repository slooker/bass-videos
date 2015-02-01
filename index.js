var AWS = require('aws-sdk'); 
var fs = require('fs');
var hogan = require('hogan');
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
/*
server.views({
  engines: { html: hogan.create() },
  path: './views',
  layoutPath: './views/layout',
  layout: true,
  partialsPath: './views/partials'
});
*/
    

// Read the files we need that never change
var indexFile = fs.readFileSync('index.hbs').toString();
var indexTemplate = hogan.compile(indexFile); 
var dayFile = fs.readFileSync('day.hbs').toString();
var dayTemplate = hogan.compile(dayFile); 
var topPartialFile = fs.readFileSync('topPartial.hbs').toString();
var topTemplate = hogan.compile(topPartialFile); 
var layoutFile = fs.readFileSync('layout.hbs').toString();
var layoutTemplate = hogan.compile(layoutFile); 
var artistFile = fs.readFileSync('artist.hbs').toString();
var artistTemplate = hogan.compile(artistFile); 
var songFile = fs.readFileSync('song.hbs').toString();
var songTemplate = hogan.compile(songFile); 

// Handle AWS stuff
var s3 = new AWS.S3(); 
var bucket = 'bass-videos'
var baseUrl = 'https://s3-us-west-1.amazonaws.com/'

// This is ugly and I wish there was a better way.
function fetchNewObjects() {
  //console.log("Fetching new objects");
  s3.listObjects({ Bucket: bucket }, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
    } else {
      // successful response
      var s3ObjectList = data["Contents"]
      s3ObjectList.forEach(function(obj) {
        // Code to fetch images if they don't already exist and download them
        if (/^images/.test(obj["Key"])) {
          imageDownload(obj["Key"]);
          return;
        } else {
          addVideo(obj["Key"]);
        }
      });
    }
  });
}

function imageDownload(imageKey) {
  
  fs.exists(imageKey, function(exists) {
    localKey = imageKey.replace('mp4', 'png').replace(/\s/g,'');
    if (!exists) {
      //console.log(imageKey);
      var file = fs.createWriteStream(localKey)
      s3.getObject({ Bucket: bucket, Key: imageKey}).
      on('httpData', function(chunk) { file.write(chunk); }).
      on('httpDone', function() { file.end(); }).
      send();
    }
  });
}

function addVideo(videoKey) {
  var key = videoKey.replace(/ /g, "+");
  var imageKey = videoKey.replace('mp4', 'png').replace(/\s/g,'');
  var entry = videoKey.split(" - ");
  var day = entry[0];
  //console.log(url);
  db.find({day: day}, function (err, docs) {
    if (docs.length === 0) { // Don't already have a video with that day (multi videos on same day are appended with .1, .2 etc)
      var artist = entry[1];
      var song = entry[2].replace(".mp4", "");
      var prettyKey = videoKey.replace(".mp4","");
      var videoUrl = baseUrl + bucket + '/' + key;
      var imageUrl ='/images/'+imageKey;
      db.insert({ day: day, artist: artist, song: song, videoUrl: videoUrl, imageUrl: imageUrl });
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
      //console.log(videos);
      var html = indexTemplate.render({videos: videos}, {layout: layoutTemplate});
      reply(html)
    });
  }
});

server.route({ 
  method: 'GET',
  path: '/bass-videos.css',
  handler: function(request, reply) {
    reply.file('bass-videos.css');
  }
});

server.route({ 
  method: 'GET',
  path: '/bass-videos.js',
  handler: function(request, reply) {
    reply.file('bass-videos.js');
  }
});

server.route({ 
  method: 'GET',
  path: '/images/{file}.png',
  handler: function(request, reply) {
    var file = 'images/'+request.params.file + '.png'
    fs.exists(file, function(exists) {
      if (/[A-Za-z0-9\-\.\'\,]+/.test(request.params.file)) {
        if (exists) {
          reply.file(file);
        } else {
          reply("No image found.").code(404);
        }
      } else {
        reply("No image found.").code(404);
      }
    });
  }
});

// TODO: Add some sort of count instead of duplicating the artist names
server.route({
  method: 'GET',
  path: '/artists',
  handler: function(request, reply) {
    db.find({}, function(err, videos) {
      var html = artistTemplate.render({videos: videos}, {layout: layoutTemplate});
      reply(html);
    });
  }
});

// TODO: Add some sort of count instead of duplicating the song names
server.route({
  method: 'GET',
  path: '/songs',
  handler: function(request, reply) {
    db.find({}, function(err, videos) {
      var html = songTemplate.render({videos: videos}, {layout: layoutTemplate});
      reply(html);
    });
  }
});

  
server.route({
  method: 'GET',
  path: '/song/{song}',
  handler: function(request, reply) {
    var song = request.params.song;
    if (/[\sA-Za-z0-9\-\.\'\,]+/.test(song)) {
      db.find({song: song}, function(err, videos) {
        videos.sort(compare);
        if (videos.length > 0) {
          if (videos.length == 1) {
            var html = dayTemplate.render({videos: [videos[0]]}, {layout: layoutTemplate});
            reply(html)
          } else if (videos.length > 1) {
            var html = indexTemplate.render({videos: videos}, {layout: layoutTemplate});
            reply(html)
          }
        } else {
          console.log("no songs found");
          reply("No song found.").code(404);
        }
      });
    } else {
      console.log("Failed test");
      reply("No song found.").code(404);
    }
  }
});

server.route({
  method: 'GET',
  path: '/artist/{artist}',
  handler: function(request, reply) {
    var artist = request.params.artist;
    if (/[\sA-Za-z0-9\-\.\'\,]+/.test(artist)) {
      db.find({artist: artist}, function(err, videos) {
        videos.sort(compare);
        if (videos.length > 0) {
          if (videos.length == 1) {
            var html = dayTemplate.render({videos: [videos[0]]}, {layout: layoutTemplate});
            reply(html)
          } else if (videos.length > 1) {
            var html = indexTemplate.render({videos: videos}, {layout: layoutTemplate});
            reply(html)
          }
        } else {
          console.log("no artists found");
          reply("No artist found.").code(404);
        }
      });
    } else {
      console.log("Failed test");
      reply("No artist found.").code(404);
    }
  }
});

server.route({ 
  method: 'GET',
  path: '/day/{day}',
  handler: function(request, reply) {
    var day = request.params.day;
    if (/^\d+$/) {
      db.find({day: day}, function(err, videos) {
        if (videos.length > 0) {
          if (videos.length == 1) {
            var html = dayTemplate.render({videos: [videos[0]]}, {layout: layoutTemplate});
            reply(html)
          } else if (videos.length > 1) {
            var html = indexTemplate.render({videos: videos}, {layout: layoutTemplate});
            reply(html)
          }
        } else {
          reply("No video found for that day.").code(404);
        }
      });
    } else {
      reply("No video found for that day.").code(404);
    }
  }
});

server.start(function() {
  // Run the fetch on startup, so I can restart and get the videos immediately if need be.
  console.log('Server running at ', server.info.uri);
  fetchNewObjects()
});
