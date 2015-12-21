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

var SongBox = React.createClass({
  render: function() {
    var alt = this.props.song + ' by ' + this.props.artist;
    return (
      <div className="box">
        <Link to='song' params={{song: this.props.song}} key={this.props._id}>
          <img src={this.props.imageUrl} alt={alt} />
        </Link>
        <div className="description">
          <p>{this.props.song} by {this.props.artist}</p>
        </div>
      </div>
    );
  }
})

var Box = React.createClass({
  render: function() {
    var alt = 'Day ' + this.day + ', ' + this.props.song + ' by ' + this.props.artist;
    return (
      <div className="box">
        <Link to='video' params={{id: this.props._id}} key={this.props._id}>
          <img src={this.props.imageUrl} alt={alt} />
        </Link><br />
        <div className="description">
          <p>Day {this.props.day}</p>
          <p>{this.props.song} by {this.props.artist}</p>
        </div>
      </div>
    );
  }
})

var Videos = React.createClass({
  render: function() {
    return (
      <div id="content">
        {this.props.videos.map(function(video) {
          if (!video.description)  {
            video.description = <block><p>Day {video.day}</p><p>{video.song} by {video.artist}</p></block>;
          }
          return <Box key={video._id} {...video} />
        })}
      </div>
    )
  }
});

var Days = React.createClass({
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
        {this.state.videos.map(function(video, i) {
          return <div className='text-list' key={i}>Day {video.day} - <Link to='video' params={{id: video._id}} key={video._id}>{video.song}</Link> by <Link to='artist' params={{artist: video.artist}}>{video.artist}</Link></div>
        })}
      </div>
    )
  }


});

var Songs = React.createClass({ 
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
          return <SongBox key={video._id} {...video} />
        })}
      </div>
    )
  }
});

var Artists = React.createClass({ 
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
    artists = extractUnique(this.state.videos, "artist");
    return (
      <div id="content">
        {artists.map(function(artist, i) {
          return (
            <div className='text-list' key={i}><Link to='artist' params={{artist: artist}}>{artist}</Link></div>
          )
        })}
      </div>
    )
  }
});

var Video = React.createClass({
  render: function() {
    return (
      <div className='big-video'>
        <video preload="metadata" controls>
          <source src={this.props.video.videoUrl} />
          <p>To view this video please enable JavaScript, and consider upgrading to a web browser that doesn't suck.</p>
        </video>
        <div className="description">Day {this.props.video.day}<br />{this.props.video.song} by {this.props.video.artist}</div>
      </div>
    )
  },
});

var SingleVideo = React.createClass({
  contextTypes: { router: React.PropTypes.func },
  loadVideo: function() {
    var id = this.context.router.getCurrentParams().id;
    Ajax.get('/api/video/'+id).then(function(response) {
      this.setState({video: response});
    }.bind(this));
  },
  getInitialState: function() {
    return {video: {}}; 
  },
  componentDidMount: function() { 
    this.loadVideo();
  },
  render: function() {
    if (this.state.video) {
      var video = this.state.video;
      return <Video video={video} key={video._id} />
    }
  }
});



var HomePageVideos = React.createClass({ 
  loadVideos: function() {
    if (Object.keys(this.props).length > 0) {
      this.setState({videos: this.props});
    } else {
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
      <Videos videos={this.state.videos} />
    );
  }
});

var Artist = React.createClass({
  contextTypes: { router: React.PropTypes.func },
  loadVideos: function() {
    var artist = this.context.router.getCurrentParams().artist;
      Ajax.get('/api/artist/'+artist).then(function(response) {
        var artistVideos = React.__spread([], this.state.artistVideos);
        artistVideos[artist] = response;

        this.setState({artistVideos: artistVideos, artist: artist});

      }.bind(this));
  },
  getInitialState: function() {
    return {artistVideos: []};
  },
  componentDidMount: function() { 
    this.loadVideos();
  },
  render: function() {
    var artist = this.context.router.getCurrentParams().artist;
    var component = <div />;
    if (Object.keys(this.state.artistVideos).length > 0) {
      if (Object.keys(this.state.artistVideos[artist]).length > 1) {
        // return a list of videos (ala homepage)
        component = <Videos videos={this.state.artistVideos[artist]} />

      } else {
        // return big video play window
        var video = this.state.artistVideos[artist][0];
        component = <Video video={video} key={video._id} />
      }
    }

    return component;
  }
});

var Song = React.createClass({
  contextTypes: { router: React.PropTypes.func },
  loadVideos: function() {
    var song = this.context.router.getCurrentParams().song;
      Ajax.get('/api/song/'+song).then(function(response) {
        var songVideos = React.__spread([], this.state.songVideos);
        songVideos[song] = response;

        this.setState({songVideos: songVideos, song: song});

      }.bind(this));
  },
  getInitialState: function() {
    return {songVideos: []};
  },
  componentDidMount: function() { 
    this.loadVideos();
  },
  render: function() {
    var song = this.context.router.getCurrentParams().song;
    var component = <div />;
    if (Object.keys(this.state.songVideos).length > 0) {
      if (Object.keys(this.state.songVideos[song]).length > 1) {
        // return a list of videos (ala homepage)
        component = <Videos videos={this.state.songVideos[song]} />

      } else {
        // return big video play window
        var video = this.state.songVideos[song][0];
        component = <Video video={video} key={video._id} />
      }
    }

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
    <DefaultRoute handler={HomePageVideos}/>
    <Route name="songs" handler={Songs}/>
    <Route name="song" path="/song/:song" handler={Song}/>
    <Route name="home" handler={HomePageVideos}/>
    <Route name="days" handler={Days}/>
    <Route name="artists" handler={Artists}/>
    <Route name="artist" path="/artist/:artist" handler={Artist}/>
    <Route name="video" path="/video/:id" handler={SingleVideo} />
  </Route>
);

  Router.run(routes, function(Handler) {
    React.render(<Handler/>, document.body);
  });
