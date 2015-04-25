var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;
var Link = Router.Link;
var Ajax = require('./ajax.min.js');


var videos = [];

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

function extractUnique(uniq, key, dedup) {
  uniq = uniqBy(uniq, key, dedup);
console.log(key);
  return uniq.map(function(u) { return u[key]; });
}

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
          <li><Link to="home">Home</Link></li>
          <li><Link to="songs">Songs</Link></li>
          <li><Link to="days">Days</Link></li>
          <li><Link to="artists">Artists</Link></li>
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
          if (!video.description)  {
            video.description = <block><p>Day {video.day}</p><p>{video.song} by {video.artist}</p></block>;
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
          return <Box key={video.id} {...video} />
        })}
      </div>
    )
  }
});

var Artists = React.createClass({ 
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
    artists = extractUnique(this.state.videos, "artist");
    console.log(artists);
    return (
      <div id="content">
        {artists.map(function(artist, i) {
          return (
            <div className='text-list'><Link to='artist' params={{artist: artist}} key={i}>{artist}</Link></div>
          )
        })}
      </div>
    )
  }
});

var Video = React.createClass({
  render: function() {
    console.log("RENDERING VIDEO");
    console.log(this.props);
    return (
      <div className='big-video'>
      
        <video preload="metadata" controls>
          <source src={this.props.videoUrl} />
          <p>To view this video please enable JavaScript, and consider upgrading to a web browser that doesn't suck.</p>
        </video>
        <div className="description">Day {this.props.day}<br />{this.props.song} by {this.props.artist}</div>
      </div>
    )
  },


});

var Artist = React.createClass({
  contextTypes: { router: React.PropTypes.func },
  loadVideos: function() {
    console.log("inside loadVideos");
    var artist = this.context.router.getCurrentParams().artist;
      Ajax.get('/api/artist/'+artist).then(function(response) {
        var artistVideos = React.__spread([], this.state.artistVideos);
        artistVideos[artist] = response;
        console.log(response);

        this.setState({artistVideos: artistVideos, artist: artist});

      }.bind(this));
  },
  getInitialState: function() {
    console.log("Artist - getInitialState");
    return {artistVideos: []};
  },
  componentDidMount: function() { 
    this.loadVideos();
  },
  render: function() {
    var artist = this.context.router.getCurrentParams().artist;
    var component = <div />;
    if (Object.keys(this.state.artistVideos).length > 0) {
      console.log("Populated array");
      if (Object.keys(this.state.artistVideos[artist]).length > 1) {
        // return a list of videos (ala homepage)
        console.log("multi video");
        component = <div>multi video</div>

      } else {
        // return big video play window
        console.log("KEYS: ");
        console.log(Object.keys(this.state.artistVideos));
        var video = this.state.artistVideos[artist][0];
        console.log(this.state.artistVideos);
        console.log("video");

        console.log(video);
        component = <Video {...video} key={video.id} />
      }
    }

    console.log("Returning component.");
    return component;
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

var routes = (
  <Route handler={HomePage}>
    <DefaultRoute handler={Videos}/>
    <Route name="songs" handler={Songs}/>
    <Route name="home" handler={Videos}/>
    <Route name="days" handler={HomePage}/>
    <Route name="artists" handler={Artists}/>
    <Route name="artist" path="/artist/:artist" handler={Artist}/>
  </Route>
);

  Router.run(routes, function(Handler) {
    React.render(<Handler/>, document.body);
  });
