import React, { Component } from 'react';
import classes from './App.css';
import Canvas from './Components/Canvas/Canvas.js';

class App extends Component {
  render() {
    return (
      <div className={classes.App}>
        <Canvas 
          nodes={this.props.nodes}
          members={this.props.members}
          forces={this.props.forces}
          supports={this.props.supports}
          supportReactions={this.props.supportReactions}
          memberReactions={this.props.memberReactions}
          moments={this.props.moments}
          solved={this.props.solved} />
      </div>
    );
  }
}

export default App;
