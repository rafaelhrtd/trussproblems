import React, { Component } from 'react';
import classes from './App.scss';
import Canvas from './Components/Canvas/Canvas.js';
import allContext from './context/allContext';
import Diagrams from './Components/Diagrams/Diagrams';

class App extends Component {
  static contextType = allContext;
  render() {
    if (this.context.solved && this.context.focus){
      return (
        <div className={classes.App}>
          <Diagrams />
        </div>
      )
    } else {
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
}

export default App;
