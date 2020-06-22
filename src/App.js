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
          forces={this.props.forces} />
      </div>
    );
  }
}

export default App;
