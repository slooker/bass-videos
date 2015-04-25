var AWS = require('aws-sdk'); 
var fs = require('fs');
var Datastore = require('nedb')
  , vidDb = new Datastore({ filename: './data/videos', autoload : true })
var schedule = require('node-schedule');
var Hapi = require('hapi');
var Path = require('path');
var config = require('./config.js');

// Schedule the new videos to be checked for every 5 minutes
var scheduled = schedule.scheduleJob('*/5 * * * *', function() {
  fetchNewObjects();
});

// Setup our hapi server
var server = new Hapi.Server({
  connections: {
    routes: {
      files: {
        relativeTo: Path.join(__dirname, "public")
      }
    }
  }
});
server.connection({ port: config.port() });

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
  vidDb.find({}, function(err,videoList) {
    videos = videoList;
  });
}

function imageDownload(imageKey) {
  fs.exists('public/'+imageKey, function(exists) {
    localKey = imageKey.replace('mp4', 'png').replace(/\s/g,'');
    if (!exists) {
      //console.log(imageKey);
      var file = fs.createWriteStream('public/'+localKey)
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
  vidDb.find({day: day}, function (err, docs) {
    if (docs.length === 0) { // Don't already have a video with that day (multi videos on same day are appended with .1, .2 etc)
      var artist = entry[1];
      var song = entry[2].replace(".mp4", "");
      var prettyKey = videoKey.replace(".mp4","");
      var videoUrl = baseUrl + bucket + '/' + key;
      var imageUrl ='/public/images/'+imageKey;
      vidDb.insert({ day: day, artist: artist, song: song, videoUrl: videoUrl, imageUrl: imageUrl });
    }
  });
}

function uniqBy(uniq, key, dedup) {
  if (dedup == null) { dedup = true; }
  uniq.sort(function(a,b){
    return a[key] < b[key] ? -1 : 1;
  });

  if (dedup) { 
    for (var i = uniq.length - 2; i >= 0; i--) {
      if (uniq[i + 1][key] == uniq[i][key]) {
        uniq.splice(i, 1);
      }
    }
  }
  return uniq;
}




server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    var index = fs.readFileSync('templates/index.html').toString();
    reply(index)
  }
});

server.route({
  method: 'GET',
  path: '/api/videos',
  handler: function(request, reply) {
    reply(uniqBy(videos, 'day', false));
  }
});

server.route({
  method: 'GET',
  path: '/api/artist/{artist}',
  handler: function(request, reply) {
    var artist = request.params.artist;
    if (/[\sA-Za-z0-9\-\.\'\,]+/.test(artist)) {
      vidDb.find({artist: artist}, function(err, videos) {
        var artistVideos = uniqBy(videos, "day", false);
        reply(artistVideos);
      });
    } else {
      reply("No artist found.").code(404);
    }
  }
});

server.route({
  method: 'GET',
  path: '/api/song/{song}',
  handler: function(request, reply) {
    var song = request.params.song;
    if (/[\sA-Za-z0-9\-\.\'\,]+/.test(song)) {
      vidDb.find({song: song}, function(err, videos) {
        var songVideos = uniqBy(videos, "day", false);
        reply(songVideos);
      });
    } else {
      reply("No song found.").code(404);
    }
  }
});

server.route({
  method: 'GET',
  path: '/api/video/{id}',
  handler: function(request, reply) {
    vidDb.find({_id: request.params.id}, function(err, video) {
      if (video.length) {
        reply(video[0]);
      } else {
        reply("No artist found.").code(404);
      }
    });
  }
});

/* 
 * Static Routes
 */
server.route({ method: 'GET', path: '/images/{filename}',
  handler: {
    file: function(request) {
      return 'images/'+request.params.filename
    }
  }
});
server.route({ method: 'GET', path: '/build/{filename}',
  handler: {
    file: function(request) {
      return 'build/'+request.params.filename
    }
  }
});
server.route({ method: 'GET', path: '/css/{filename}',
  handler: {
    file: function(request) {
      return 'css/'+request.params.filename
    }
  }
});

server.route({ method: 'GET', path: '/js/{filename}',
  handler: {
    file: function(request) {
      return 'js/'+request.params.filename
    }
  }
});

/*
// TODO: Add some sort of count instead of duplicating the artist names
server.route({
  method: 'GET',
  path: '/artists',
  handler: function(request, reply) {
    vidDb.find({}, function(err, videos) {
      videos = uniqBy(videos, "artist");
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
    vidDb.find({}, function(err, videos) {
      videos = uniqBy(videos, "song"); //.sort(compareBySong);
      
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
      vidDb.find({song: song}, function(err, videos) {
        videos = uniqBy(videos, "song", false);
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
      vidDb.find({artist: artist}, function(err, videos) {
        videos = uniqBy(videos, "day", false);
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

// TODO: Need to handle days with multiple videos.  It redirects us back to the multiple video page for a day.
server.route({ 
  method: 'GET',
  path: '/days',
  handler: function(request, reply) {
    vidDb.find({}, function(err,videos) {
      videos = uniqBy(videos, "day", false);
      var days = {};
      videos.forEach(function(vid) {
        days[vid["day"]] = days[vid["day"]] ? days[vid["day"]] + 1 : 1;
      });
      var html = daysTemplate.render({videos: videos, days: days}, {layout: layoutTemplate});
      reply(html)
    });
  }
});

server.route({ 
  method: 'GET',
  path: '/day/{id}',
  handler: function(request, reply) {
    var id = request.params.id;
    if (/^\w+$/) {
      vidDb.find({_id: id}, function(err, videos) {
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
*/


server.start(function() {
  // Run the fetch on startup, so I can restart and get the videos immediately if need be.
  console.log('Server running at ', server.info.uri);
  fetchNewObjects()
});
