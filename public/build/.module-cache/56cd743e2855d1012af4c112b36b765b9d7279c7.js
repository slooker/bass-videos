var Header = React.createClass({displayName: "Header",
  render: function() {
    return (
      React.createElement("div", {id: "top"}, 
            React.createElement("h1", null, "All About That Bass qwe"), 
            "One man's struggle to not suck at the bass.  Still a better love story than twilight."
        )
    );
  }
});

var Nav = React.createClass({displayName: "Nav", 
  render: function() {
    return (
      React.createElement("div", {id: "left-rail"}, 
        React.createElement("ul", null, 
          React.createElement("li", null, React.createElement("a", {href: "/"}, "Home")), 
          React.createElement("li", null, React.createElement("a", {href: "/songs"}, "Songs")), 
          React.createElement("li", null, React.createElement("a", {href: "/days"}, "Days")), 
          React.createElement("li", null, React.createElement("a", {href: "/artists"}, "Artists"))
        )
      )
    );
  }
})

var Box = React.createClass({displayName: "Box",
  render: function() {
    return (
      React.createElement("div", {class: "box"}, 
        React.createElement("a", {href: this.props.anchorUrl}, 
          React.createElement("img", {src: this.props.imageUrl, alt: this.props.altTag})
        ), React.createElement("br", null), 
        React.createElement("div", {class: "description"}, "Day ", this.props.day, React.createElement("br", null), this.props.song, " by ", this.props.artist)
      )
    );
  }
})

var Videos = React.createClass({displayName: "Videos",
  loadVideos: function() {
    console.log("calling loadVideos");
    var videos = [];
    Ajax.get('/api/videos').then(function(response) {
      console.log("loading videos");
      this.setState({videos: videos});
    });
  },
  getInitialState: function() {
    return {videos: []};
  },
  componentDidMount: function() {
    this.loadVideos();
  },
  render: function() {
    console.log(this.props.data);
    this.props.data.map(function(video) {
      return React.createElement(Box, {anchorUrl: video.videoUrl, imageUrl: video.imageUrl, day: video.day, song: video.song, artist: video.artist}) 
    });
  }

});

var VideoList = React.createClass({displayName: "VideoList",
  render: function() {
    return (
      React.createElement("div", {id: "content"}, 
        React.createElement(Videos, null)
      )
    );
  }
});

var HomePage = React.createClass({displayName: "HomePage",
  render: function() {
    return (
     React.createElement("html", null, 
      React.createElement("body", null, 
      React.createElement(Header, null), 
      React.createElement("div", {id: "container"}, 

        React.createElement(Nav, null), 
        React.createElement(VideoList, null)
      )
)
)
    )
  }
});

React.render(
  React.createElement(HomePage, null),
  document.getElementById('example')
);

