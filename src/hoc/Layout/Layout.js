import React, { Component } from 'react';
import App from '../../App.js';
import classes from './Layout.css';
import Toolbar from '../Toolbar/Toolbar.js';
import allContext from '../../context/allContext';
import { setFocusItem, deleteMember, deleteForce, deleteMoment } from './layoutHelper';
import Sidebar from '../Toolbar/Sidebar/Sidebar';
import Solver from '../../Components/Solver/Solver';

class Layout extends Component {
    state = {
        nodes: {},
        members: {},
        forces: {},
        supports: {},
        moments: {},
        nodeCount: 0,
        memberCount: 0,
        forceCount: 0,
        supportCount: 0,
        momentCount: 0,
        supportReactions: {},
        solutionErrors: {},
        memberReactions: {},
        solved: false,
        sideBarNew: true,
        sideBarObject: 'node'
    }

    addSupportReactions = (reactions) => {
        if (JSON.stringify(reactions) !== JSON.stringify(this.state.supportReactions)){
            this.setState({supportReactions: reactions});
        }
    }

    addSolutionErrors = (errors, options = {}) => {
        if (JSON.stringify(errors) !== JSON.stringify(this.state.solutionErrors)){
            this.setState({solutionErrors: errors, solved: false, truss: false, frame: false});
        }
        if (!errors){
            this.setState({solved: true, focus: null, frame: options.frame, truss: options.truss});
        }
    }

    addMemberReactions = (reactions) => {
        if (JSON.stringify(reactions) !== JSON.stringify(this.state.memberReactions)){
            this.setState({memberReactions: reactions});
        }
    }

    addNode = (inputElements) => {
        // if editing existent node
        if (inputElements.edit){
            this.setState((prevState => {
                let nodes = {...prevState.nodes};
                let node = {...nodes[inputElements.id]};
                node.x = parseFloat(inputElements.x.value);
                node.y = parseFloat(inputElements.y.value);
                node.connectionType = inputElements.connectionType.value;
                nodes[inputElements.id] = node;
                return({nodes: nodes});
            }))
        // if making new node
        } else {
            this.setState((prevState) => {
                const id = prevState.nodeCount + 1
                let nodes = {...prevState.nodes}
                nodes[id] = {
                    x: parseFloat(inputElements.x.value),
                    y: parseFloat(inputElements.y.value),
                    connectionType: inputElements.connectionType.value,
                    id: id,
                    members: [],
                    force: null,
                    support: null,
                    moment: null
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
                support.supportType = inputElements.supportType.value
                supports[support.id] = support
                // fix nodes
                let prevNode = {...nodes[prevState.supports[support.id].node]}
                let currentNode = {...nodes[support.node]}
                prevNode.support = null
                currentNode.support = support.id
                nodes[prevNode.id] = prevNode
                nodes[currentNode.id] = currentNode
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
                    let moments = {...prevState.moments}
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
                        if (support.node === node.id){
                            delete supports[support.id]                         
                        }
                    })
                    Object.keys(moments).map(key => {
                        const moment = moments[key]
                        if (moment.node === node.id){
                            delete moments[moment.id]                         
                        }
                    })
                    delete nodes[node.id]
                    return({nodes: nodes, members: members, forces: forces, supports: supports})
                })
                break;
            case 'member':
                this.setState(prevState => {
                    let newElements = deleteMember(inputElements.id, prevState.nodes, prevState.members, prevState.forces, prevState.members)
                    return({members: newElements.members, nodes: newElements.nodes, forces: newElements.forces})
                })
                break;
            case 'force':
                this.setState(prevState => {
                    let newElements = deleteForce(inputElements.id, prevState.nodes, prevState.members, prevState.forces)
                    return({members: newElements.members, nodes: newElements.nodes, forces: newElements.forces})
                })
                break;
            case 'moment':
                this.setState(prevState => {
                    let newElements = deleteMoment(inputElements.id, prevState.nodes, prevState.members, prevState.moments)
                    return({members: newElements.members, nodes: newElements.nodes, moments: newElements.moments})
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
                        forces: [],
                        moments: []
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
                    let accepted = ['id', 'member', 'forceType', 'xForceStart', 'yForceStart', 'xForceEnd', 'yForceEnd', 'startPoint', 'endPoint']
                    force.xForceStart = parseFloat(inputElements.xForceStart.value)
                    force.yForceStart = parseFloat(inputElements.yForceStart.value)
                    force.xForceEnd = parseFloat(inputElements.xForceEnd.value)
                    force.yForceEnd = parseFloat(inputElements.yForceEnd.value)
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
                    let accepted = ['id', 'member', 'forceType', 'xForceStart', 'yForceStart', 'xForceEnd', 'yForceEnd', 'startPoint', 'endPoint']
                    force.xForceStart = parseFloat(inputElements.xForceStart.value)
                    force.yForceStart = parseFloat(inputElements.yForceStart.value)
                    force.xForceEnd = parseFloat(inputElements.xForceEnd.value)
                    force.yForceEnd = parseFloat(inputElements.yForceEnd.value)
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
                force.xForce = parseFloat(inputElements.xForce.value)
                force.yForce = parseFloat(inputElements.yForce.value)
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
                    xForce: parseFloat(inputElements.xForce.value),
                    yForce: parseFloat(inputElements.yForce.value),
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

    addNodeMoment = (inputElements) => {
        // if editing moment
        if (inputElements.edit){
            this.setState(prevState => {
                let moments = {...prevState.moments}
                let moment = {...moments[inputElements.id]}
                moment.node = parseInt(inputElements.node.value)
                moment.moment = parseFloat(inputElements.moment.value)
                moments[moment.id] = moment;
                // remove from previous nodes
                let nodes = {...prevState.nodes}
                let prevNode = {...nodes[prevState.moments[moment.id].node]}
                prevNode.moment = null
                nodes[prevNode.id] = prevNode
                // add to current node
                let node = {...nodes[moment.node]}
                node.moment = moment.id
                nodes[node.id] = node
                return({
                    moments: moments,
                    nodes: nodes
                })
            })
        // if adding new moment
        } else {
            this.setState(prevState => {
                let moments = {...prevState.moments}
                const moment = {
                    id: prevState.momentCount+1,
                    node: parseInt(inputElements.node.value),
                    moment: parseFloat(inputElements.moment.value)
                }
                // add to current node
                let nodes = {...prevState.nodes}
                let node = {...nodes[moment.node]}
                node.moment = moment.id
                nodes[node.id] = node
                moments[prevState.momentCount + 1] = moment
                return({
                    moments: moments,
                    nodes: nodes,
                    momentCount: prevState.momentCount + 1
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
                force.xForce = parseFloat(inputElements.xForce.value)
                force.yForce = parseFloat(inputElements.yForce.value)
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
                    xForce: parseFloat(inputElements.xForce.value),
                    yForce: parseFloat(inputElements.yForce.value),
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
    
    componentDidMount = () => {
        this.addNode({
            x: {value: 0},
            y: {value: 0},
            connectionType: {value: 'pinned'}
        })
        this.addNode({
            x: {value: 1},
            y: {value: 0},
            connectionType: {value: 'pinned'}
        })
        this.addNode({
            x: {value: 1},
            y: {value: 1},
            connectionType: {value: 'pinned'}
        })
        this.addNode({
            x: {value: 2},
            y: {value: 0},
            connectionType: {value: 'pinned'}
        })
        setTimeout(() => {
            this.addSupport({
                supportType: {value: 'pinned'},
                node: {value: 1},
            })
            this.addSupport({
                supportType: {value: 'yRoller'},
                node: {value: 4},
            })
            this.addMember({
                nodeA: {value: 1},
                nodeB: {value: 2}
            })
            this.addMember({
                nodeA: {value: 2},
                nodeB: {value: 3}
            })
            this.addMember({
                nodeA: {value: 3},
                nodeB: {value: 4}
            })
            this.addMember({
                nodeA: {value: 1},
                nodeB: {value: 3}
            })
            this.addMember({
                nodeA: {value: 2},
                nodeB: {value: 4}
            })
        }, 500)
    }

    backToBuilder = () => {
        this.setState({
            solved: false,
            supportReactions: {},
            memberReactions: {}
        });
    }

    removeFocus = () => {
        this.setState({focus: null});
    }
    addTrussCheck = (isTruss) => {
        this.setState({isTruss: isTruss})
    }
    render(){
        return (
            <allContext.Provider value={{
                nodes: this.state.nodes,
                members: this.state.members,
                forces: this.state.forces,
                supports: this.state.supports,
                moments: this.state.moments,
                backToBuilder: this.backToBuilder,
                addTrussCheck: this.addTrussCheck,
                addSupportReactions: this.addSupportReactions,
                addMemberReactions: this.addMemberReactions,
                removeFocus: this.removeFocus,
                addSolutionErrors: this.addSolutionErrors,
                addNode: this.addNode,
                addNodeCoordinates: this.addNodeCoordinates,
                addMember: this.addMember,
                setFocusItem: setFocusItem.bind(this),
                focus: this.state.focus,
                deleteElement: this.deleteElement,
                addMemberForce: this.addMemberForce,
                solutionErrors: this.state.solutionErrors,
                solved: this.state.solved,
                supportReactions: this.state.supportReactions,
                memberReactions: this.state.memberReactions,
                addNodeForce: this.addNodeForce,
                addSupport: this.addSupport,
                addNodeMoment: this.addNodeMoment,
                truss: this.state.truss,
                frame: this.state.frame
            }}>
                <div className={classes.Container}>
                    <Sidebar
                        sideBarNew={this.state.sideBarNew}
                        sideBarObject={this.state.sideBarObject}
                        nodes={this.state.nodes}
                        members={this.state.members}
                        forces={this.state.forces}
                        supports={this.state.supports}/>
                    <App
                        nodes={this.state.nodes}
                        members={this.state.members}
                        forces={this.state.forces}
                        supports={this.state.supports}
                        moments={this.state.moments}
                        solved={this.state.solved}
                        supportReactions={this.state.supportReactions}
                        memberReactions={this.state.memberReactions} />
                </div>
            </allContext.Provider>
        )
    }
}

export default Layout;