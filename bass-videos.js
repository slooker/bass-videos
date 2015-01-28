document.addEventListener("DOMContentLoaded", function(event) {
  // scale size based on width
  var videos = document.getElementsByTagName('video');
  var width = videos[0].offsetWidth;
  var height = width * 0.5625;
  console.log("Width: "+width+", Height: "+height);

    for (var i = 0; i < videos.length; i++) {
      var vidPlayer = videos[i];
      vidPlayer.setAttribute("height",height);
      vidPlayer.setAttribute("width",width);
    }




  //html5 - prevent simultaneous video playback - pauses other playing videos upon play
  function stopOtherVideos() {
    var videoPlayers = document.getElementsByTagName('video');
    for (var i = 0; i < videoPlayers.length; i++) {
      var vidPlayer = videoPlayers[i];
      vidPlayer.pause();
    }
  }

  // Handle onclick listeners.  This seems ugly, but it's fast?  ... that's good..ish?
  document.getElementById('video-list').addEventListener('click', function(event) {
    if (event.target.className === 'row') {
      stopOtherVideos();
      var vidId = event.target.id + "-video";
      var hideThese = document.getElementsByClassName('video-row');
      for (var i = 0; i < hideThese.length; i++) {
        var myDiv = document.getElementById(hideThese[i].id);
        myDiv.style.display = 'none';

      }
      var current = document.getElementById(vidId);
      current.style.display = 'block'
    }
  });
});
