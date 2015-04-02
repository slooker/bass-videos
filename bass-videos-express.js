var AWS = require('aws-sdk'); 
var fs = require('fs');
var hogan = require('hogan');
var express = require('express');
var Datastore = require('nedb')
  , vidDb = new Datastore({ filename: './data/videos', autoload : true })
var schedule = require('node-schedule');

// Schedule the new videos to be checked for every 5 minutes
var scheduled = schedule.scheduleJob('*/5 * * * *', function() {
  fetchNewObjects();
});

// Setup our express server
var app = express();


// Read the files we need that never change
var indexFile = fs.readFileSync('templates/index.hbs').toString();
var indexTemplate = hogan.compile(indexFile); 
var dayFile = fs.readFileSync('templates/day.hbs').toString();
var dayTemplate = hogan.compile(dayFile); 
var topPartialFile = fs.readFileSync('templates/topPartial.hbs').toString();
var topTemplate = hogan.compile(topPartialFile); 
var layoutFile = fs.readFileSync('templates/layout.hbs').toString();
var layoutTemplate = hogan.compile(layoutFile); 
var artistFile = fs.readFileSync('templates/artist.hbs').toString();
var artistTemplate = hogan.compile(artistFile); 
var songFile = fs.readFileSync('templates/song.hbs').toString();
var songTemplate = hogan.compile(songFile); 
var daysFile = fs.readFileSync('templates/days.hbs').toString();
var daysTemplate = hogan.compile(daysFile); 

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
  vidDb.find({day: day}, function (err, docs) {
    if (docs.length === 0) { // Don't already have a video with that day (multi videos on same day are appended with .1, .2 etc)
      var artist = entry[1];
      console.log(entry);
      var song = entry[2].replace(".mp4", "");
      var prettyKey = videoKey.replace(".mp4","");
      var videoUrl = baseUrl + bucket + '/' + key;
      var imageUrl ='/images/'+imageKey;
      vidDb.insert({ day: day, artist: artist, song: song, videoUrl: videoUrl, imageUrl: imageUrl });
    }
  });
}

function uniqBy(uniq, key, dedup) {
  if (dedup == null) { dedup = true; }
  uniq.sort(function(a,b){
    return a[key] < b[key] ? -1 : 1;
  });
  //console.log(uniq);

  if (dedup) { 
    for (var i = uniq.length - 2; i >= 0; i--) {
      if (uniq[i + 1][key] == uniq[i][key]) {
        uniq.splice(i, 1);
      }
    }
  }
  return uniq;
}

app.get('/', function(req, res) {
  vidDb.find({}, function(err,videos) {
    videos = uniqBy(videos, "day", false);
    var html = indexTemplate.render({videos: videos}, {layout: layoutTemplate});
    res.send(html)
  });
});

app.get('/css/:filename.css', function(req, res) {
  res.sendFile(__dirname+'/'+'css/'+req.params.filename+'.css');
});

/*
app.get('/bass-videos.js', function(req, res) {
  res.sendFile(__dirname+'/'+'bass-videos.js');
});
*/

app.get('/flame-hapi.svg', function(req, res) {
  res.sendFile(__dirname+'/'+'images/nodestack-hapi.svg');
});

app.get('/flame-express.svg', function(req, res) {
  res.sendFile(__dirname+'/'+'images/nodestack-express.svg');
});

app.get('/images/:file.png', function(req, res) {
  var file = 'images/'+req.params.file + '.png'
  fs.exists(file, function(exists) {
    if (/[A-Za-z0-9\-\.\'\,]+/.test(req.params.file)) {
      if (exists) {
        res.sendFile(__dirname+'/'+file);
      } else {
        res.status(404).send('No image found');
      }
    } else {
      res.status(404).send('No image found');
    }
  });
});


app.get('/artists', function(req, res) {
    vidDb.find({}, function(err, videos) {
      videos = uniqBy(videos, "artist");
      var html = artistTemplate.render({videos: videos}, {layout: layoutTemplate});
      res.send(html);
    });
});

app.get('/songs', function(req, res) {
    vidDb.find({}, function(err, videos) {
      videos = uniqBy(videos, "song"); //.sort(compareBySong);
      var html = songTemplate.render({videos: videos}, {layout: layoutTemplate});
      res.send(html);
    });
});

app.get('/song/:song', function(req, res) {
  var song = req.params.song;
  if (/[\sA-Za-z0-9\-\.\'\,]+/.test(song)) {
    vidDb.find({song: song}, function(err, videos) {
      videos = uniqBy(videos, "song", false);
      if (videos.length > 0) {
        if (videos.length == 1) {
          var html = dayTemplate.render({videos: [videos[0]]}, {layout: layoutTemplate});
          res.send(html)
        } else if (videos.length > 1) {
          var html = indexTemplate.render({videos: videos}, {layout: layoutTemplate});
          res.send(html)
        }
      } else {
        console.log("no songs found");
        res.status(404).send('No song found');
      }
    });
  } else {
    console.log("Failed test");
    res.status(404).send('No song found');
  }

});

app.get('/artist/:artist', function(req, res) {
  var artist = req.params.artist;
  if (/[\sA-Za-z0-9\-\.\'\,]+/.test(artist)) {
    vidDb.find({artist: artist}, function(err, videos) {
      videos = uniqBy(videos, "day", false);
      if (videos.length > 0) {
        if (videos.length == 1) {
          var html = dayTemplate.render({videos: [videos[0]]}, {layout: layoutTemplate});
          res.send(html)
        } else if (videos.length > 1) {
          var html = indexTemplate.render({videos: videos}, {layout: layoutTemplate});
          res.send(html)
        }
      } else {
        console.log("no artists found");
        res.status(404).send('No artist found');
      }
    });
  } else {
    console.log("Failed test");
    res.status(404).send('No artist found');
  }
});

app.get('/days', function(req, res) {
  vidDb.find({}, function(err,videos) {
    videos = uniqBy(videos, "day", false);
    var days = {};
    videos.forEach(function(vid) {
      days[vid["day"]] = days[vid["day"]] ? days[vid["day"]] + 1 : 1;
    });
    var html = daysTemplate.render({videos: videos, days: days}, {layout: layoutTemplate});
    res.send(html)
  });
});

app.get('/day/:id', function(req, res) {
  var id = req.params.id;
  if (/^\w+$/) {
    vidDb.find({_id: id}, function(err, videos) {
      if (videos.length > 0) {
        if (videos.length == 1) {
          var html = dayTemplate.render({videos: [videos[0]]}, {layout: layoutTemplate});
          res.send(html)
        } else if (videos.length > 1) {
          var html = indexTemplate.render({videos: videos}, {layout: layoutTemplate});
          res.send(html)
        }
      } else {
        res.status(404).send('No video found for that day');
      }
    });
  } else {
    res.status(404).send('No video found for that day');
  }
});

var server = app.listen(8000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
