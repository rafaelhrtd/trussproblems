import React, { Component } from 'react';
import App from '../../App.js';
import classes from './Layout.css'
import Toolbar from '../Toolbar/Toolbar.js'
import allContext from '../../context/allContext'

class Layout extends Component {
    state = {
        nodes: {},
        members: {},
        forces: {}
    }

    addNode = (x, y) => {
        this.setState((prevState) => {
            const id = Object.keys(this.state.nodes).length
            let nodes = {...prevState.nodes}
            nodes[id] = {
                x: parseFloat(x),
                y: parseFloat(y),
                id: id,
                members: []
            }
            return ({
                nodes: nodes
            })
        })
    }

    addMember = (nodeA, nodeB) => {
        this.setState(prevState => {
            const id = Object.keys(this.state.members).length
            let members = {...prevState.members}
            let nodes = {...prevState.nodes}
            members[id] = {
                nodeA: nodeA.id,
                nodeB: nodeB.id
            }
            nodes[nodeA.id].members.push(members[id])
            return({
                members: members,
                nodes: nodes
            })
        })
    }

    addNodeCoordinates = (nodes) => {
        this.setState(() => {
            return {nodes: nodes}
        })
    }

    render(){
        return (
            <allContext.Provider value={{
                nodes: this.state.nodes,
                members: this.state.members,
                forces: this.state.forces,
                addNode: this.addNode,
                addNodeCoordinates: this.addNodeCoordinates,
                addMember: this.addMember
            }}>
                <div className={classes.Container}>
                    <Toolbar />
                    <App
                        nodes={this.state.nodes}
                        members={this.state.members}
                        forces={this.state.forces} />
                </div>
            </allContext.Provider>
        )
    }
}

export default Layout;