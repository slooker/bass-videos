var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;
var Link = Router.Link;
var Ajax = require('Ajax');


var videos = [];

var Header = React.createClass({
  render: function() {
    return (
      <div id="top">
            <h1>All About That Bass</h1>
            One man's struggle to not suck at the bass.  Still a better love story than twilight.
        </div>
    );
  }
});

var Nav = React.createClass({ 
  render: function() {
    return (
      <div id="left-rail">
        <ul>
          <li><a href="/">Home</a></li>
          <li><Link to="songs">Songs</Link></li>
          <li><a href="/days">Days</a></li>
          <li><a href="/artists">Artists</a></li>
        </ul>
      </div>
    );
  }
})

var Box = React.createClass({
  render: function() {
    return (
      <div className="box">
        <a href={this.props.anchorUrl}>
          <img src={this.props.imageUrl} alt={this.props.altTag} />
        </a><br />
        <div className="description">
          {this.props.description}
        </div>
      </div>
    );
  }
})

var Videos = React.createClass({
  loadVideos: function() {
    console.log("calling loadVideos");
    Ajax.get('/api/videos').then(function(response) {
      console.log("loading videos");
      this.setState({videos: response});
    }.bind(this));
  },
  getInitialState: function() {
    console.log("videos getInitialState");
    return {videos: []};
  },
  componentDidMount: function() { 
    console.log("Videos component did mount");
    this.loadVideos();
  },
  render: function() {
    return (
      <div id="content">
        {this.state.videos.map(function(video) {
          video.description = "Day "+video.day+"<br />"+video.song+" by "+video.artist;
          return <Box {...video} />
          //return <Box anchorUrl={video.videoUrl} imageUrl={video.imageUrl} day={video.day} song={video.song} artist={video.artist} /> 
        })}
      </div>
    )
  }
});

var Songs = React.createClass({ 
  loadVideos: function() {
    if (videos.length == 0) {
      Ajax.get('/api/videos').then(function(response) {
        console.log("loading videos in snogs");
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
      <div id="content">
        {this.state.videos.map(function(video) {
          video.description = video.song+" by "+video.artist;
          video.anchorUrl = '/song/'+video.song;
          return <Box {...video} />
          //return <Box anchorUrl="/song/{video.song}" imageUrl={video.imageUrl} day={video.day} song={video.song} artist={video.artist} /> 
          //return "Test string"
        })}
      </div>
    )
  }



});

var HomePage = React.createClass({
  render: function() {
    return (
      <html>
        <body> 
          <Header />
          <div id="container">
            <Nav />
            <RouteHandler />
          </div>
        </body>
      </html>
    )
  }
});

var SongPage = React.createClass({
  render: function() {
    return (
      <html>
        <body>
          <Header />
          <div id="container">
            <Nav />
            <Songs />
These are songs.
          </div>
        </body>
      </html>
    );
  }
});

/*
React.render(
  <HomePage />,
  document.getElementById('example')
);
*/

var routes = (
  <Route handler={HomePage}>
    <DefaultRoute handler={Videos}/>
    <Route name="songs" handler={Songs}/>
  </Route>
);

  console.log("Loaded");
  Router.run(routes, function(Handler) {
    React.render(<Handler/>, document.getElementById('example'));
  });
