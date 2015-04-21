var videos = [];

var Header = React.createClass({displayName: "Header",
  render: function() {
    return (
      React.createElement("div", {id: "top"}, 
            React.createElement("h1", null, "All About That Bass"), 
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
          React.createElement("li", null, React.createElement("a", {href: "/songs", id: "songsPage"}, "Songs")), 
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
      React.createElement("div", {className: "box"}, 
        React.createElement("a", {href: this.props.anchorUrl}, 
          React.createElement("img", {src: this.props.imageUrl, alt: this.props.altTag})
        ), React.createElement("br", null), 
        React.createElement("div", {className: "description"}, "Day ", this.props.day, React.createElement("br", null), this.props.song, " by ", this.props.artist)
      )
    );
  }
})

var Videos = React.createClass({displayName: "Videos",
  loadVideos: function() {
    console.log("calling loadVideos");
    Ajax.get('/api/videos').then(function(response) {
      console.log("loading videos");
      console.log(response);
      this.setState({videos: response});
    }.bind(this));
  },
  getInitialState: function() {
    console.log("videos getInitialState");
    return {videos: []};
  },
  componentDidMount: function() { 
    console.log("Videos componentn did mount");
    this.loadVideos();
  },
  render: function() {
    return (
      React.createElement("div", {id: "content"}, 
        this.state.videos.map(function(video) {
          return React.createElement(Box, {anchorUrl: video.videoUrl, imageUrl: video.imageUrl, day: video.day, song: video.song, artist: video.artist}) 
        })
      )
    )
  }
});

var Songs = React.createClass({displayName: "Songs", 
  loadVideos: function() {
    if (videos.length == 0) {
      Ajax.get('/api/videos').then(function(response) {
        console.log("loading videos");
        console.log(response);
        this.setState({videos: response});
      }.bind(this));
    }
  },
  getInitialState: function() {
    console.log("videos getInitialState");
    return {videos: []};
  },
  componentDidMount: function() { 
    console.log("Videos componentn did mount");
    this.loadVideos();
  },
  render: function() {
    return (
      React.createElement("div", {id: "content"}, 
        this.state.videos.map(function(video) {
          return React.createElement(Box, {anchorUrl: "/song/{video.song}", imageUrl: video.imageUrl, day: video.day, song: video.song, artist: video.artist}) 
        })
      )
    )
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
        React.createElement(Videos, null)
      ), 
      React.createElement(RouteHandler, null)
)
)
    )
  }
});

var SongPage = React.createClass({displayName: "SongPage",
  render: function() {
    return (
      React.createElement("html", null, 
        React.createElement("body", null, 
          React.createElement(Header, null), 
          React.createElement("div", {id: "container"}, 
            React.createElement(Nav, null), 
            React.createElement(Songs, null)
          )
        )
      )
    );
  }
});

/*
React.render(
  <HomePage />,
  document.getElementById('example')
);
*/

var Router = ReactRouter;
var Route = ReactRouter.Route;

var routes = (
  React.createElement(Route, {handler: HomePage}, 
    React.createElement(Route, {name: "home", path: "/", handler: HomePage})
  )
);

Router.run(routes, function(Handler) {
  React.render(React.createElement(Handler, null), document.getElementById('example'));
});
