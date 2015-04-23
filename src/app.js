var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;
var Link = Router.Link;
var Ajax = require('./ajax.min.js');


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
    Ajax.get('/api/videos').then(function(response) {
      this.setState({videos: response});
    }.bind(this));
  },
  getInitialState: function() {
    return {videos: []};
  },
  componentDidMount: function() { 
    this.loadVideos();
  },
  render: function() {
    return (
      <div id="content">
        {this.state.videos.map(function(video) {
          if (!video.description)  {
            video.description = <span><p>Day {video.day}</p><p>{video.song} by {video.artist}</p></span>;
          }
          return <Box key={video.id} {...video} />
        })}
      </div>
    )
  }
});

var Songs = React.createClass({ 
  loadVideos: function() {
    if (videos.length == 0) {
      Ajax.get('/api/videos').then(function(response) {
        this.setState({videos: response});
      }.bind(this));
    }
  },
  getInitialState: function() {
    return {videos: []};
  },
  componentDidMount: function() { 
    this.loadVideos();
  },
  render: function() {
    return (
      <div id="content">
        {this.state.videos.map(function(video) {
          video.description = <p>{video.song} by {video.artist}</p>;
          video.anchorUrl = '/song/'+video.song;
          return <Box {...video} />
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

  Router.run(routes, function(Handler) {
    React.render(<Handler/>, document.getElementById('example'));
  });
