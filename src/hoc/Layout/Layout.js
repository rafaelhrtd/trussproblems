import React, { Component } from 'react';
import App from '../../App.js';
import classes from './Layout.css';
import Toolbar from '../Toolbar/Toolbar.js';
import allContext from '../../context/allContext';
import { setFocusItem, deleteMember, deleteForce } from './layoutHelper';
import Sidebar from '../Toolbar/Sidebar/Sidebar';

class Layout extends Component {
    state = {
        nodes: {},
        members: {},
        forces: {},
        supports: {},
        nodeCount: 0,
        memberCount: 0,
        forceCount: 0,
        supportCount: 0,
        sideBarNew: true,
        sideBarObject: 'node'
    }

    addNode = (inputElements) => {
        // if editing existent node
        if (inputElements.edit){
            this.setState((prevState => {
                let nodes = {...prevState.nodes}
                let node = {...nodes[inputElements.id]}
                node.x = inputElements.x.value
                node.y = inputElements.y.value
                nodes[inputElements.id] = node
                return({nodes: nodes})
            }))
        // if making new node
        } else {
            this.setState((prevState) => {
                const id = prevState.nodeCount + 1
                let nodes = {...prevState.nodes}
                nodes[id] = {
                    x: parseFloat(inputElements.x.value),
                    y: parseFloat(inputElements.y.value),
                    id: id,
                    members: [],
                    force: null,
                    support: null
                }
                return ({
                    nodes: nodes,
                    nodeCount: id 
                })
            })
        }
    }

    addSupport = (inputElements) => {
        if (inputElements.edit){
            this.setState((prevState) => {
                let nodes = {...prevState.nodes}
                let supports = {...prevState.supports}
                let support = {...supports[inputElements.id]}
                // edit support
                support.node = parseInt(inputElements.node.value)
                support.type = inputElements.supportType.value
                supports[support.id] = support
                // fix nodes
                let prevNode = {...nodes[prevState.supports[support.id].node]}
                console.log('prevNode')
                console.log(prevNode)
                let currentNode = {...nodes[support.node]}
                console.log('currentNode')
                console.log(currentNode)
                prevNode.support = null
                currentNode.support = support.id
                nodes[prevNode.id] = prevNode
                nodes[currentNode.id] = currentNode
                console.log(supports)
                return ({
                    nodes: nodes,
                    supports: supports
                })
            })
            
        // new support
        } else {
            this.setState((prevState) => {
                const id = prevState.supportCount + 1
                let nodes = {...prevState.nodes}
                let supports = {...prevState.supports}
                let node = {...nodes[parseInt(inputElements.node.value)]}
                // add support
                let support = {
                    id: id,
                    node: node.id,
                    supportType: inputElements.supportType.value
                }
                supports[id] = support
                // add to node
                node.support = support.id
                nodes[node.id] = node
                return ({
                    supportCount: id,
                    nodes: nodes,
                    supports: supports
                })
            })
        }
    }

    deleteElement = (inputElements) => {
        switch(inputElements.type){
            case 'node':
                this.setState(prevState => {
                    let nodes = {...prevState.nodes}
                    let node = {...nodes[inputElements.id]}
                    let members = {...prevState.members}
                    let forces = {...prevState.forces}
                    let supports = {...prevState.supports}
                    // remove dependents
                    Object.keys(members).map(key => {
                        const member = members[key]
                        if (member.nodeA === node.id || member.nodeB === node.id){
                            const newElements = deleteMember(member.id, nodes, members, forces)
                            nodes = newElements.nodes
                            node = {...nodes[node.id]}
                            members = newElements.members
                            forces = newElements.forces
                        }
                    })
                    Object.keys(forces).map(key => {
                        const force = forces[key]
                        if (force.node.id === node.id){
                            const newElements = deleteForce(force.id, nodes, members, forces)
                            nodes = newElements.nodes
                            node = {...nodes[node.id]}
                            members = newElements.members
                            forces = newElements.forces                         
                        }
                    })
                    Object.keys(supports).map(key => {
                        const support = supports[key]
                        if (support.node.id === node.id){
                            delete supports[support.id]                         
                        }
                    })
                    delete nodes[node.id]
                    return({nodes: nodes, members: members, forces: forces, supports: supports})
                })
                break;
            case 'member':
                this.setState(prevState => {
                    let newElements = deleteMember(inputElements.id, prevState.nodes, prevState.members, prevState.forces)
                    return({members: newElements.nodes, nodes: newElements.members, forces: newElements.forces})
                })
                break;
            case 'force':
                this.setState(prevState => {
                    let newElements = deleteForce(inputElements.id, prevState.nodes, prevState.members, prevState.forces)
                    return({members: newElements.nodes, nodes: newElements.members, forces: newElements.forces})
                })
                break;
            case 'support':
                this.setState(prevState => {
                    let supports = {...prevState.supports}
                    let support = {...supports[inputElements.id]}
                    let nodes = {...prevState.nodes}
                    let node = {...nodes[support.node]}
                    delete supports[support.id]
                    // remove from parent
                    node.support = null
                    nodes[node.id] = node
                    return({supports: supports, nodes: nodes})
                })
                break;
        }
    }

    addMember = (inputElements) => {
        // todo check that there is no existent one here
        if (inputElements.nodeA.value !== inputElements.nodeB.value){
            // if editing existent
            if (inputElements.edit){
                this.setState(prevState => {
                    let members = {...prevState.members};
                    let member = {...members[inputElements.id]};
                    member.nodeA = parseInt(inputElements.nodeA.value);
                    member.nodeB = parseInt(inputElements.nodeB.value);

                    member.nodes = () => {
                        return {
                            a: this.state.nodes[parseInt(inputElements.nodeA.value)],
                            b: this.state.nodes[parseInt(inputElements.nodeB.value)]
                        }
                    }
                    members[inputElements.id] = member;
                    
                    // Previous nodes
                    let nodes = {...prevState.nodes}
                    let prevNodeA = {...prevState.nodes[prevState.members[member.id].nodeA]}
                    let prevNodeB = {...prevState.nodes[prevState.members[member.id].nodeB]}
                    // remove from previous nodes
                    for(let index = 0; index < prevNodeA.members.length; index++){
                        if (prevNodeA.members[index].id === member.id){
                            prevNodeA.members.splice(index,1)
                            break;
                        }
                    }
                    for(let index = 0; index < prevNodeB.members.length; index++){
                        if (prevNodeB.members[index].id === member.id){
                            prevNodeB.members.splice(index,1)
                            break
                        }
                    }
                    // add to new nodes
                    let nodeA = {...prevState.nodes[member.nodeA]}
                    let nodeB = {...prevState.nodes[member.nodeB]}
                    nodeA.members.push(member)
                    nodeB.members.push(member)
                    // add to node collection
                    nodes[nodeA.id] = nodeA
                    nodes[nodeB.id] = nodeB
                    
                    return({members: members, nodes: nodes})
                })
            } else {
                this.setState(prevState => {
                    const id = this.state.memberCount + 1
                    let members = {...prevState.members}
                    let nodes = {...prevState.nodes}
                    members[id] = {
                        nodes: () => {
                            return {
                                a: this.state.nodes[parseInt(inputElements.nodeA.value)],
                                b: this.state.nodes[parseInt(inputElements.nodeB.value)]
                            }
                        },
                        nodeA: parseInt(inputElements.nodeA.value),
                        nodeB: parseInt(inputElements.nodeB.value),
                        id: prevState.memberCount + 1,
                        forces: []
                    }
                    nodes[parseInt(inputElements.nodeA.value)].members.push(members[id])
                    nodes[parseInt(inputElements.nodeB.value)].members.push(members[id])
                    return({
                        members: members,
                        nodes: nodes,
                        memberCount: prevState.memberCount + 1
                    })
                })
            }
        }
        return null
    }

    addMemberForce = (inputElements) => {
        // if editing existing force
        if (inputElements.edit){
            this.setState(prevState => {
                let forces = {...prevState.forces}
                let force = {...forces[inputElements.id]}
                // update current force
                force.member = parseInt(inputElements.member.value);
                force.forceType = inputElements.forceType.value;
                if (inputElements.forceType.value === 'point'){
                    let accepted = ['id', 'member', 'forceType', 'xForce', 'yForce', 'location']
                    force.xForce = parseFloat(inputElements.xForce.value)
                    force.yForce = parseFloat(inputElements.yForce.value)
                    force.location = parseFloat(inputElements.location.value)
                    // remove keys that are not accepted
                    Object.keys(force).map(key => {
                        if (!accepted.includes(key)){
                            delete force[key]
                        }
                    })
                } else if (inputElements.forceType.value === 'distributed'){
                    let accepted = ['id', 'member', 'forceType', 'startXForce', 'startYForce', 'endXForce', 'endYForce', 'startPoint', 'endPoint']
                    force.startXForce = parseFloat(inputElements.startXForce.value)
                    force.startYForce = parseFloat(inputElements.startYForce.value)
                    force.endXForce = parseFloat(inputElements.endXForce.value)
                    force.endYForce = parseFloat(inputElements.endYForce.value)
                    force.startPoint = parseFloat(inputElements.startPoint.value)
                    force.endPoint = parseFloat(inputElements.endPoint.value)
                    // remove keys that are not accepted
                    Object.keys(force).map(key => {
                        if (!accepted.includes(key)){
                            delete force[key]
                        }
                    })
                }
                // set edited force
                forces[force.id] = force
                // remove force from previous member
                let members = {...prevState.members}
                let prevMember = {...members[prevState.forces[force.id].member]}
                for(let index = 0; index < prevMember.forces.length; index++){
                    if (prevMember.forces[index] === force.id){
                        prevMember.forces.splice(index,1)
                        break;
                    }
                }

                // add to new member
                let member = {...members[force.member]}
                member.forces = [...member.forces]
                member.forces.push(force.id)

                // update members
                members[prevMember.id] = prevMember
                members[member.id] = member
                return({
                    forces: forces,
                    members: members
                })
            })
        // if adding force
        } else {
            this.setState(prevState => {
                let forces = {...prevState.forces}
                let members = {...prevState.members}
                let member = {...members[inputElements.member.value]}
                members[member.id] = member
                member.forces = member.forces ? [...member.forces, prevState.forceCount + 1] : [prevState.forceCount+1]
                let force = {
                    id: prevState.forceCount+1,
                    member: parseInt(inputElements.member.value),
                    forceType: inputElements.forceType.value
                }
                if (inputElements.forceType.value === 'point'){
                    let accepted = ['id', 'member', 'forceType', 'xForce', 'yForce', 'location']
                    force.xForce = parseFloat(inputElements.xForce.value)
                    force.yForce = parseFloat(inputElements.yForce.value)
                    force.location = parseFloat(inputElements.location.value)
                    // remove keys that are not accepted
                    Object.keys(force).map(key => {
                        if (!accepted.includes(key)){
                            delete force[key]
                        }
                    })
                } else if (inputElements.forceType.value === 'distributed'){
                    let accepted = ['id', 'member', 'forceType', 'startXForce', 'startYForce', 'endXForce', 'endYForce', 'startPoint', 'endPoint']
                    force.startXForce = parseFloat(inputElements.startXForce.value)
                    force.startYForce = parseFloat(inputElements.startYForce.value)
                    force.endXForce = parseFloat(inputElements.endXForce.value)
                    force.endYForce = parseFloat(inputElements.endYForce.value)
                    force.startPoint = parseFloat(inputElements.startPoint.value)
                    force.endPoint = parseFloat(inputElements.endPoint.value)
                    // remove keys that are not accepted
                    Object.keys(force).map(key => {
                        if (!accepted.includes(key)){
                            delete force[key]
                        }
                    })
                }
                forces[prevState.forceCount + 1] = force
                return({
                    forces: forces,
                    forceCount: prevState.forceCount + 1,
                    members: members
                })
            })
        }
    }

    addNodeForce = (inputElements) => {
        // if editing force
        if (inputElements.edit){
            this.setState(prevState => {
                let forces = {...prevState.forces}
                let force = {...forces[inputElements.id]}
                force.node = parseInt(inputElements.node.value)
                force.xForce = parseInt(inputElements.xForce.value)
                force.yForce = parseInt(inputElements.yForce.value)
                forces[force.id] = force
                // remove from previous nodes
                let nodes = {...prevState.nodes}
                let prevNode = {...nodes[prevState.forces[force.id].node]}
                prevNode.force = null
                nodes[prevNode.id] = prevNode
                // add to current node
                let node = {...nodes[force.node]}
                node.force = force.id
                nodes[node.id] = node
                return({
                    forces: forces,
                    nodes: nodes
                })
            })
        // if adding new force
        } else {
            this.setState(prevState => {
                let forces = {...prevState.forces}
                const force = {
                    id: prevState.forceCount+1,
                    node: parseInt(inputElements.node.value),
                    xForce: inputElements.xForce.value,
                    yForce: inputElements.yForce.value,
                }
                // add to current node
                let nodes = {...prevState.nodes}
                let node = {...nodes[force.node]}
                node.force = force.id
                nodes[node.id] = node
                forces[prevState.forceCount + 1] = force
                return({
                    forces: forces,
                    nodes: nodes,
                    forceCount: prevState.forceCount + 1
                })
            })
        }
    }

    addNodeCoordinates = (nodes) => {
        this.setState(() => {
            return {nodes: nodes}
        })
    }

    componentDidUpdate = () => {
    }

    render(){
        return (
            <allContext.Provider value={{
                nodes: this.state.nodes,
                members: this.state.members,
                forces: this.state.forces,
                addNode: this.addNode,
                addNodeCoordinates: this.addNodeCoordinates,
                addMember: this.addMember,
                setFocusItem: setFocusItem.bind(this),
                focus: this.state.focus,
                deleteElement: this.deleteElement,
                addMemberForce: this.addMemberForce,
                addNodeForce: this.addNodeForce,
                addSupport: this.addSupport
            }}>
                <div className={classes.Container}>
                    <Sidebar
                        sideBarNew={this.state.sideBarNew}
                        sideBarObject={this.state.sideBarObject} />
                    <App
                        nodes={this.state.nodes}
                        members={this.state.members}
                        forces={this.state.forces}
                        supports={this.state.supports} />
                </div>
            </allContext.Provider>
        )
    }
}

export default Layout;