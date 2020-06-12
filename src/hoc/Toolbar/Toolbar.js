import React, { Component } from 'react';
import classes from './Toolbar.css';
import Tool from './Tool/Tool.js'
import allContext from '../../context/allContext';

class Toolbar extends Component {
    static contextType = allContext;

    addNode = (state) => {
        this.context.addNode(state.x, state.y);
    }

    render() {
        const tools = {
            addNode: {
                name: "Add node",
                form: {
                    x: {
                        name: "x-position",
                        type: "text",
                    },
                    y: {
                        name: "y-position",
                        type: "text"
                    },
                },
                submitText: "Add node",
                submitFunction: this.addNode
            }
        }

        return (
            <div className={classes.Toolbar}>
                {Object.keys(tools).map(key => (
                    <Tool key={key} tool={tools[key]} />
                ))}
            </div>
        )
    }
}

export default Toolbar