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
        React.createElement("a", {href: "{this.props.anchorUrl}"}, 
          React.createElement("img", {src: "{this.props.imageUrl}", alt: "{this.props.altTag}"})
        ), React.createElement("br", null), 
        React.createElement("div", {class: "description"}, "Day ", this.props.day, React.createElement("br", null), this.props.song, " by ", this.props.artist)
      )
    );
  }
})

var VideoList = React.createClass({displayName: "VideoList",
  render: function() {
    return (
      React.createElement("div", {id: "content"}, 
        React.createElement(Box, {anchorUrl: "/day/zKuEGaKP34jC7zLI", imageUrl: "/images/002-AliceCooper-NoMoreMr.NiceGuy.png", altTag: "Day 002 playing No More Mr. Nice Guy by Alice Cooper", day: "002", song: "No More Mr. Nice Guy", artist: "Alice Cooper"}), 
        React.createElement(Box, {anchorUrl: "/day/o3gPPLO42FxAv0wM", imageUrl: "/images/003-Pantera-CemetaryGates.png", altTag: "Day 003 playing Cemetary Gates by Pantera", day: "003", song: "Cemetary Gates", artist: "Pantera"})
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

