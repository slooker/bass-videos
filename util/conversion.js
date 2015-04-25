var AWS = require('aws-sdk');
var fs = require('fs');
var exec = require('child_process').exec;

var s3 = new AWS.S3();
var bucket = 'bass-videos';
var s3bucket = new AWS.S3({params: {Bucket: bucket}});

fs.readdir(".", function(err, files) {
  if (err) {
    throw err;
  }
  files.forEach(function(file) {
    if (/.mp4$/.test(file)) {
      // Mp4 file.  Keep going.
      var image = file.replace(/.mp4$/, ".png");
      // Check to see if png exists
      fs.exists('images/'+image, function(exists) {
        if (!exists) {
          var cmd = "\"c:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe\" -i \""+file+"\" -n -vf scale=480:270 -r 1 -t 1 \"images/"+image+"\"";
          console.log("Executing "+cmd);
          exec(cmd, function(err, stdout, stderr) {
            console.log("command executed");
            if (err) {
              console.log("Error running ffmpeg command: "+err);
            } else {
              console.log("Starting upload for images/"+image);
              // Upload png
              fs.readFile("images/"+image, function(err, data) {
                s3bucket.upload({Key: 'images/'+image, Body: data }, function(err, data) {
                  if (err) {
                    console.log("Error uploading data:", err);
                  } else {
                    console.log("Successfully uploaded image.");
                  }
                });
              });

              // Upload mp4
              fs.readFile(file, function(err, data) {
                s3bucket.upload({Key: file, Body: data }, function(err, data) {
                  if (err) {
                    console.log("Error uploading data:", err);
                  } else {
                    console.log("Successfully uploaded video.");
                  }
                });

              });
            }
          });
        }
      });
    }
  });
})
