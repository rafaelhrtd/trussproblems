import {solve} from './LinearEquationSolver';
import { support } from '../../hoc/Toolbar/Sidebar/sidebarHelper';

export const allNodesConnected = function(){
    let nodes = {...this.props.nodes};
    let members = {...this.props.members};
    // first node
    let node = nodes[Object.keys(nodes)[0]];
    let visitedNodes = Object.keys(nodes).length !== 0 ? nodeTreeDescend(node, nodes, members) : [];
    return Object.keys(nodes).length === visitedNodes.length
}

// returns list of ids of nodes that are connected to first node
// options.sections === true makes it so that it does not traverse through
// moving joints (so that they may be grouped up)
const nodeTreeDescend = function(node, nodes, members, visitedNodes = [], options = {}){
    visitedNodes.push(node.id);
    node.members.map(member => {
        let nodeA = member.nodeA;
        let nodeB = member.nodeB;
        // if one of the nodes has not yet been checked
        if ((!visitedNodes.includes(nodeA) 
            || !visitedNodes.includes(nodeB))
            && !(options.sections && node.connectionType === 'pinned')){
            let currentNode = !visitedNodes.includes(nodeA) ? nodes[nodeA] : nodes[nodeB];
            visitedNodes = nodeTreeDescend(currentNode, nodes, members, visitedNodes, options)
        }
    })
    return visitedNodes
}

// organize sections
const buildSection = function(nodesArray, nodes, members){
    let sectionMembers = []
    let section = {}
    Object.keys(members).map(key => {
        let member = members[key];
        const nodeA = nodes[member.nodeA]
        const nodeB = nodes[member.nodeB]
        if (nodesArray.includes(member.nodeA) && nodesArray.includes(member.nodeB)
            && (!(nodeA.connectionType === 'pinned' && nodeB.connectionType === 'pinned') || nodesArray.length === 2)){
            sectionMembers.push(member.id)
        }
    })
    section.members = sectionMembers.sort();
    section.nodes = nodesArray.sort();
    return section
}

export const getSections = function(){
    let sections = {}
    const nodes = this.props.nodes
    const members = this.props.members
    let counter = 1;

    // add sections to sections
    Object.keys(nodes).map(key => {
        const node = nodes[key]
        if (node.connectionType === 'pinned'){
            node.members.map(member => {
                const otherNode = member.nodeA === node.id ? nodes[member.nodeB] : nodes[member.nodeA]
                if (otherNode.connectionType === 'pinned'){
                    const currentNodes = [node.id, otherNode.id]
                    const newSection = buildSection(currentNodes, nodes, members);
                    if (newSection){
                        let sectionIsNew = true
                        for (let i = 0 ; i < Object.keys(sections).length ; i++){
                            let section = sections[Object.keys(sections)[i]]
                            if (JSON.stringify(section.nodes) === JSON.stringify(newSection.nodes)){
                                sectionIsNew = false;
                                break;
                            }
                        }
                        if (sectionIsNew){
                            sections[counter] = newSection
                            sections[counter].id = counter
                            sections[counter].connections = {}
                            counter++
                        }
                    }
                }
            })
        } else {
            const currentNodes = nodeTreeDescend(node, nodes, members, [], {sections: true})
            const newSection = buildSection(currentNodes, nodes, members);
            if (newSection){
                let sectionIsNew = true
                for (let i = 0 ; i < Object.keys(sections).length ; i++){
                    let section = sections[Object.keys(sections)[i]]
                    if (JSON.stringify(section.nodes) === JSON.stringify(newSection.nodes)){
                        sectionIsNew = false;
                        break;
                    }
                }
                if (sectionIsNew){
                    sections[counter] = newSection
                    sections[counter].id = counter
                    sections[counter].connections = {}
                    counter++
                }
            }
        }
    })
    
    // add connections
    Object.keys(nodes).map(key => {
        const node = nodes[key]
        let nodeSections = []
        // find sections connected by node
        if (node.connectionType === 'pinned'){
            // iterate through sections and add them if connected to node
            Object.keys(sections).map(sectionKey => {
                let section = sections[sectionKey]
                if (section.nodes.includes(node.id)){
                    nodeSections.push(parseInt(sectionKey))
                }
            })
        }
        // iterate through all sections
        Object.keys(sections).map(key => {
            let section = sections[key]
            // iterate through sections connected to this node
            if (nodeSections.includes(section.id)){
                let connections = [];
                nodeSections.map(sectionID => {
                    if (sectionID !== section.id){
                        connections.push(sectionID);
                    }
                })
                if (connections.length > 0){
                    section.connections[node.id] = connections;
                }
            }
        })
    })
    sections = sectionReducer(sections);
    return (sections) 
}

// join sections when they are connected at more than one place
const sectionReducer = function(sections){
    let finishedReducing = false;
    // until the program can acertain no leftover sections, continue checking
    while (!finishedReducing){
        finishedReducing = true;
        for (let i = 0 ; i < Object.keys(sections).length ; i++){
            const sectionA = sections[Object.keys(sections)[i]];
            for (let j = 0 ; j < Object.keys(sections).length ; j++){
                const sectionB = sections[Object.keys(sections)[j]];
                // if section is different
                if (i !== j){
                    let numConnections = 0;
                    Object.keys(sectionA.connections).map(key => {
                        const connection = sectionA.connections[key];
                        // add to total connections between nodeA and nodeB
                        if (connection.includes(sectionB.id)){
                            numConnections++
                        }
                    })
                    // if two sections are connected at more than one place,
                    // they should be treated as ONE section
                    if (numConnections > 1){
                        sections = joinSections(sectionA, sectionB, sections);
                        finishedReducing = false;
                        break;
                    }
                }
            }
            // start over if a reduction happened
            if (!finishedReducing){
                break;
            }
        }
    }
    return sections
}

const joinSections = function(sectionA, sectionB, sections){
    // delete sections from each other's connections
    
    for (let i = 0; i < 2; i++){
        const a = i === 0 ? {...sectionA} : {...sectionB};
        const b = i !== 0 ? {...sectionA} : {...sectionB};
        Object.keys(a.connections).map(key => {
            const connection = a.connections[key];
            for (let j = 0 ; j < connection.length ; j++){
                const sectionID = connection[j];
                if (sectionID === b.id){
                    const innersections = sections;
                    a.connections[key].splice(j, 1);
                    break;
                }
            }
        })
        sectionA = i === 0 ? a : b;
        sectionB = i !== 0 ? a : b;
    }
    // add members from sectionB to sectionA
    sectionB.members.map(memberID => {
        if (!sectionA.members.includes(memberID)){
            sectionA.members.push(memberID);
        }
    })

    // add nodes from sectionB to sectionA
    sectionB.nodes.map(nodeID => {
        if (!sectionA.nodes.includes(nodeID)){
            sectionA.nodes.push(nodeID);
        }
    })

    // add connections from sectionB to sectionA
    Object.keys(sectionB.connections).map(key => {
        const connection = sectionB.connections[key];
        if (sectionA.connections[key]){
            connection.map(id => {
                if (!sectionA.connections[key].includes(id)){
                    sectionA.connections[key].push(id);
                }
            })
        } else {
            sectionA.connections[key] = [...connection];
        }
    })
         
    // remove empty connections
        Object.keys(sectionA.connections).map(key => {
        if (sectionA.connections[key].length === 0){
            delete sectionA.connections[key];
        }
    })

    // edit connections from other sections
    Object.keys(sections).map(key => {
        let section = sections[key];
        Object.keys(section.connections).map(connectionKey => {
            let connection = section.connections[connectionKey];
            // remove sectionB if the node is connected to both
            if (connection.includes(sectionA.id) && connection.includes(sectionB.id)){
                for (let i = 0 ; i < connection.length ; i++){
                    if (connection[i] === sectionB.id){
                        connection.splice(i, 1);
                        break;
                    }
                }
            } else if (connection.includes(sectionB.id)) {
                for (let i = 0 ; i < connection.length ; i++){
                    if (connection[i] === sectionB.id){
                        connection[i] = sectionA.id;
                        break;
                    }
                }
            }
            section.connections[connectionKey] = connection;
        })
    })
    const section = {...sectionA}
    sections[sectionA.id] = section;
    delete sections[sectionB.id];
    return sections;
}

// get the nodes from which the moments will be evaluated
const momentNodes = function(nodes, supports = {}, sections){
    let momentNodes = []
    const reactionNumber = numberOfReactions(supports, nodes);
    
    Object.keys(sections).map(key => {
        const section = sections[key]
        const sectionSupports = [] 
        let sectionNodes = []
        section.nodes.map(nodeID => {
            const node = nodes[nodeID];
            if (node.support){
                sectionSupports.push(node);
            }
        })
        for (let i = 0 ; i < section.nodes.length ; i++){
            const node = nodes[section.nodes[i]];
            if (node.support){
                if (momentNodes.length < reactionNumber - 2){
                    if (!sectionNodes.includes(node.id) && sectionSupports.length > 1){
                        momentNodes = [...momentNodes, {...node, section: section.id}]
                        sectionNodes.push(node.id)
                    }
                    for (let j = 0 ; j < node.members.length ; j++ ){
                        const member = node.members[j];
                        let otherNode = member.nodeA === node.id ? nodes[member.nodeB] : nodes[member.nodeA]
                        if (momentNodes.length === reactionNumber - 2){
                            break;
                        }
                        if (!sectionNodes.includes(otherNode.id) && section.nodes.includes(otherNode.id) && section.nodes.includes(node.id)){
                            momentNodes = [...momentNodes, {...otherNode, section: section.id}]
                            sectionNodes.push(otherNode.id)
                        }
                    }
                }
            }
        }
    })
    return momentNodes 
}

const getConnections = function(sections){
    let connections = {};
    Object.keys(sections).map(key => {
        const section = sections[key]
        Object.keys(section.connections).map(connectionKey => {

            if (connections[connectionKey]){
                connections[connectionKey].sections.push(section.id);
            } else {
                connections[connectionKey] = {};
                connections[connectionKey].sections = [];
                connections[connectionKey].sections.push(section.id);
            }
        })
    })
    return connections
}
/*
    This is the most important function, which organized the matrix A in AX=B
    The order in which this is done is as follows:
    1)  In order of sections, each section gets two summations of forces in the x-
        and y- directions, in which the external forces (supports) are first considered
        (in the order x-force, y-force, moment, where these apply). Then, each connection
        gets its own two forces (x- and y-directions) to account for the internal structure.
        
        The number of columns is the number of reactions + 2 * (number of connections for all sections)
        The number of rows is given as (number of sections) * 2
    2)  Each section gets its own summation of moments wrt the previously mentioned forces.
        The number of columns is the same as before, and the number of rows is equal
        to the number of sections. The order in which forces are considered is the same
        as in the summation of forces.

    If the truss or frame is statically determinate, this will result in a square matrix
    Otherwise:
    - If there are more columns than rows, the truss is hyperstatic.
    - If there are more rows than columns, the truss requires additional supports.
    
*/ 
export const linearEquationSystem = function(){
    const nodes = this.props.nodes  === undefined ? {} : this.props.nodes
    const supports = this.props.supports === undefined ? {} : this.props.supports
    const forces = this.props.forces === undefined ? {} : this.props.forces;
    const sections = getSections.bind(this)() 
    // moments
    const connections = getConnections(sections);
    const unknownMoments = sectionAMoments(supports, sections, connections, nodes)
    const unknownForces = forceVectors(sections, nodes, supports, connections);
    const knownForces = resultantForceVector.bind(this)(nodes, sections, connections, forces)
    const knownMoments = resultantMomentVector.bind(this)(connections, sections)

    let aMatrix = [...unknownForces, ...unknownMoments];
    let bMatrix = [...knownForces, ...knownMoments];
    let textA = ""
    let textB = ""
    aMatrix.map(innerArray => {
        Object.keys(innerArray).map(index => {
            const val = innerArray[index];
            textA = textA + val;
            if (index < innerArray.length - 1){
                textA = textA + ", "
            } else {
                textA = textA + "; "
            }
        })
    })
    bMatrix.map(value => {
        textB = textB + value + ", "
    })
    console.log('aMatrix')
    console.log(aMatrix)
    console.log('bMatrix')
    console.log(bMatrix)
    const solution = solve(aMatrix, bMatrix);
}

const forceVectors = function(sections, nodes, supports, connections){
    let vectors = [];
    Object.keys(sections).map(key => {
        let sectionVector = [];
        const section = sections[key];
        let xForces = [] 
        let yForces = []
        Object.keys(supports).map(supportKey => {
            const support = supports[supportKey];
            const node = nodes[support.node];
            // hold the nodes with multiple members
            if (section.nodes.includes(node.id) && 
                !Object.keys(connections).map(key => (parseInt(key))).includes(node.id)){
                if (support.supportType === 'fixed'){
                    xForces = [...xForces, 1, 0, 0];
                    yForces = [...yForces, 0, 1, 0];
                } else if (support.supportType === 'pinned'){
                    xForces = [...xForces, 1, 0];
                    yForces = [...yForces, 0, 1];
                } else if (support.supportType === 'xRoller'){
                    xForces = [...xForces, 1];
                    yForces = [...yForces, 0];
                } else if (support.supportType === 'yRoller'){
                    xForces = [...xForces, 0];
                    yForces = [...yForces, 1];
                }
            } else {
                if (support.supportType === 'fixed'){
                    xForces = [...xForces, 0, 0, 0];
                    yForces = [...yForces, 0, 0, 0];
                } else if (support.supportType === 'pinned'){
                    xForces = [...xForces, 0, 0];
                    yForces = [...yForces, 0, 0];
                } else if (support.supportType === 'xRoller'){
                    xForces = [...xForces, 0];
                    yForces = [...yForces, 0];
                } else if (support.supportType === 'yRoller'){
                    xForces = [...xForces, 0];
                    yForces = [...yForces, 0];
                }
            }
        }) // finished adding supports
        // adding connection forces
        Object.keys(connections).map(connectionKey => {
            const connection = connections[connectionKey];
            for (let i = 0; i < connection.sections.length ; i++){
                const sectionID = connection.sections[i];
                if (section.id === sectionID){
                    xForces = [...xForces, 1, 0];
                    yForces = [...yForces, 0, 1];
                } else {
                    xForces = [...xForces, 0, 0];
                    yForces = [...yForces, 0, 0];
                }
            }
        })
        vectors = [...vectors, xForces, yForces];
    })
    // add summation at connections
    Object.keys(connections).map(outerKey => {
        let xForces = [] 
        let yForces = []
        Object.keys(supports).map(supportKey => {
            const support = supports[supportKey];
            const node = nodes[support.node];
            // hold the nodes with multiple members
            if (outerKey == support.node){
                if (support.supportType === 'fixed'){
                    xForces = [...xForces, 1, 0, 0];
                    yForces = [...yForces, 0, 1, 0];
                } else if (support.supportType === 'pinned'){
                    xForces = [...xForces, 1, 0];
                    yForces = [...yForces, 0, 1];
                } else if (support.supportType === 'xRoller'){
                    xForces = [...xForces, 1];
                    yForces = [...yForces, 0];
                } else if (support.supportType === 'yRoller'){
                    xForces = [...xForces, 0];
                    yForces = [...yForces, 1];
                }
            } else {
                if (support.supportType === 'fixed'){
                    xForces = [...xForces, 0, 0, 0];
                    yForces = [...yForces, 0, 0, 0];
                } else if (support.supportType === 'pinned'){
                    xForces = [...xForces, 0, 0];
                    yForces = [...yForces, 0, 0];
                } else if (support.supportType === 'xRoller'){
                    xForces = [...xForces, 0];
                    yForces = [...yForces, 0];
                } else if (support.supportType === 'yRoller'){
                    xForces = [...xForces, 0];
                    yForces = [...yForces, 0];
                }
            }
        }) // finished adding supports
        // adding connection forces
        Object.keys(connections).map(innerKey => {
            const innerConnection = connections[innerKey];
            for (let i = 0; i < innerConnection.sections.length ; i++){
                if (innerKey === outerKey){
                    xForces = [...xForces, -1, 0];
                    yForces = [...yForces, 0, -1];
                } else {
                    xForces = [...xForces, 0, 0];
                    yForces = [...yForces, 0, 0];
                }
            }
        })
        vectors = [...vectors, xForces, yForces];
    })
    return vectors
}
// get force summations for the B vector
const resultantForceVector = function(nodes, sections, connections, forces){
    let forceVector = [];

    // deal with forces applied to sections
    Object.keys(sections).map(key => {
        const section = sections[key];
        const totalForce = {
            x: 0,
            y: 0
        }
        Object.keys(forces).map(forceKey => {
            const force = forces[forceKey]
            if (force.node || (force.member && force.forceType === 'point')){
                if ((section.nodes.includes(force.node) || 
                     section.members.includes(force.member)) &&
                     !Object.keys(connections).map(connection => (parseInt(connection))).includes(force.node)){
                    totalForce.x -= force.xForce;
                    totalForce.y -= force.yForce;
                }
            } else if (force.forceType === 'distributed'){
                if (section.members.includes(force.member)){
                    const equivForce = forceLocation.bind(this)(force);
                    totalForce.x -= equivForce.xForce.amount;
                    totalForce.y -= equivForce.yForce.amount;
                }
            }
        });
        forceVector = [...forceVector, totalForce.x, totalForce.y]
    })
    // deal with connection forces
    Object.keys(connections).map(key => {
        const connection = connections[key]
        const node = nodes[key];
        if (node.force){
            const force = forces[node.force];
            forceVector = [...forceVector, -force.xForce, -force.yForce];
        } else {
            forceVector = [...forceVector, 0, 0];
        }
    })
    return forceVector
}

const sectionHasSupport = function(section, nodes){
    let hasSupport = false;
    section.nodes.map(nodeID => {
        const node  = nodes[nodeID];
        if (node.support){
            hasSupport = true;
        }
    })
    return hasSupport;
}

export const getSolution = function(){
    const nodes = this.props.forces
    const members = this.props.forces
    const forces = this.props.forces
    const supports = this.props.forces
    var LinSystem = require("linear-equation-system");
}

const interNodalDistance = function(nodeA, nodeB){
    return {
        x: nodeB.x - nodeA.x,
        y: nodeB.y - nodeA.y
    }
}

// get resultant moments for B matrix
const resultantMomentVector = function(connections, sections){
    const forces = this.props.forces; 
    const nodes = this.props.nodes;
    const members = this.props.members;
    const moments = this.props.moments;
    let resultantMoments = []
    Object.keys(sections).map(key => {
        let sectionMoment = 0;
        const section = sections[key];
        const momentNode = nodes[section.nodes[0]];
        // deal with node forces first (only if they are not a connection)
        section.nodes.map(nodeID => {
            const node = nodes[nodeID];
            if (node.force && 
                !Object.keys(connections).map(ID => parseInt(ID)).includes(node.id)){
                const force = forces[node.force];
                const fLocation = forceLocation.bind(this)(force)
                const distance = {
                    x: fLocation.x - momentNode.x,
                    y: fLocation.y - momentNode.y
                }
                sectionMoment -= force.yForce * distance.x;
                sectionMoment += force.xForce * distance.y;
            }
            if (node.moment){
                const moment = moments[node.moment]
                sectionMoment += moment.moment
            }

        })
        // deal with member forces
        section.members.map(memberID => {
            const member = members[memberID];
            member.forces.map(forceID => {
                const force = forces[forceID];
                if (force.forceType === 'point'){
                    const fLocation = forceLocation.bind(this)(force)
                    const distance = {
                        x: fLocation.x - momentNode.x,
                        y: fLocation.y - momentNode.y
                    }
                    sectionMoment -= force.yForce * distance.x;
                    sectionMoment += force.xForce * distance.y;
                } else if (force.forceType === 'distributed'){
                    const equivForce = forceLocation.bind(this)(force);
                    const distance = {
                        x: equivForce.yForce.location.x - momentNode.x,
                        y: equivForce.xForce.location.y - momentNode.y
                    }
                    sectionMoment -= equivForce.yForce.amount * distance.x;
                    sectionMoment += equivForce.xForce.amount * distance.y;
                }
            })
            console.log(member)
            console.log(moments);
            member.moments.map(momentID => {
                const moment = moments[momentID]
                sectionMoment += moment.moment
            })
        })
        // deal with moments
        
        resultantMoments = [...resultantMoments, sectionMoment];
    })
    return resultantMoments;
}

// get moments of supports in sections
const sectionAMoments = function(supports, sections, connections, nodes){
    let moments = []
    Object.keys(sections).map(sectionKey => {
        const section = sections[sectionKey];
        // get first node in section
        const nodeA = nodes[section.nodes[0]]
        const sectionMoments = getNodeMoments(nodeA, nodes, supports, sections, connections, section);
        moments.push(sectionMoments)
    })
    return moments
}

const getNodeMoments = function(nodeA, nodes, supports, sections, connections, nodeSection){
    let moments = [];
    // deal with support moments
    for (let i = 0 ; i < Object.keys(supports).length ; i++){
        const support = supports[Object.keys(supports)[i]];
        const nodeB = nodes[support.node]
        // only add the support if it is not a connection
        const distance = interNodalDistance(nodeA, nodeB);
        if (!Object.keys(connections).map(key => (parseInt(key))).includes(nodeB.id)){
            if (nodeSection.nodes.includes(nodeB.id)){
                moments = addMoments(support, distance, moments);
            } else {
                moments = addMoments(support, distance, moments, {zero: true})
            }
        } else {
            moments = addMoments(support, distance, moments, {zero: true})
        }
    }
    // deal with connection moments

    Object.keys(connections).map(connectionKey => {
        const connection = connections[connectionKey];
        const nodeB = nodes[connectionKey];
        const distance = interNodalDistance(nodeA, nodeB);
        for (let i = 0 ; i < connection.sections.length ; i++){
            const sectionID = connection.sections[i];
            if (sectionID === nodeSection.id){
                moments = addMoments(null, distance, moments)
            } else {
                moments = addMoments(null, distance, moments, {zero: true})
            }
        }
    })
    return moments;
}

const getNodeSections = function(node, sections){
    let nodeSections = {};
    Object.keys(sections).map(key => {
        const section = sections[key]
        if (section.nodes.includes(node.id)){
            nodeSections[key] = section;
        }
    })
    return nodeSections;
}

const addMoments = function(support, distance, moments, options = {}){
    if (options.zero){
        if (support){
            if (['fixed', 'xRoller', 'pinned'].includes(support.supportType)){
                moments.push(0)
            }
            if (['fixed', 'yRoller', 'pinned'].includes(support.supportType)) {
                moments.push(0)                    
            }
            if (support.supportType === 'fixed'){
                moments.push(0)
            }
        } else {
            moments.push(0)
            moments.push(0)
        }
    } else {
        if (support){
            if (['fixed', 'xRoller', 'pinned'].includes(support.supportType)){
                moments.push(-distance.y)
            }
            if (['fixed', 'yRoller', 'pinned'].includes(support.supportType)) {
                moments.push(distance.x)                    
            }
            if (support.supportType === 'fixed'){
                moments.push(1)
            }
        } else {
            moments.push(-distance.y)
            moments.push(distance.x)
        }
    }
    return moments
}


const nodesInSameSection = function(sections, nodes, nodeA, nodeB){
    for (let i = 0 ; i < Object.keys(sections).length ; i++){
        const section = sections[Object.keys(sections)[i]];
        if (section.nodes.includes(nodeA.id) && section.nodes.includes(nodeB.id)){
            return true
        }
    }
    return false
}

const getTotalForces = function(section){
    const forces = this.props.forces;
    let totalForce = {
        x: 0,
        y: 0
    };
    Object.keys(forces).map(key => {
        const force = forces[key]
        if (force.node || (force.member && force.forceType === 'point')){
            if (section.nodes.includes(force.node) || section.members.includes(force.member)){
                totalForce.x -= force.xForce;
                totalForce.y -= force.yForce;
            }
        } else if (force.forceType === 'distributed'){
            if (section.members.includes(force.member)){
                const equivForce = forceLocation.bind(this)(force);
                totalForce.x -= equivForce.xForce.amount;
                totalForce.y -= equivForce.yForce.amount;
            }
        }
    });
    return totalForce;
}

export const forceLocation = function(force){
    let location = null
    if (force.node){
        const node = this.props.nodes[force.node];
        location = {x: node.x, y: node.y};
    } else if (force.member) {
        let member = this.props.members[force.member]
        if (force.forceType === 'point'){
            location = memberForceLocation.bind(this)(member, force.location)
        } else if (force.forceType === 'distributed'){
            let start = memberForceLocation.bind(this)(member, force.startPoint)
            let end = memberForceLocation.bind(this)(member, force.endPoint)
            return equivalentDistributedForce(start, end, force)
        }
    }
    return location
}

// get position on line made by start and end coordinates
const getPosOnLine = (line, start, value) => {
    if (line.slope !== null){
        return(line.slope * value + line.intercept)
    } else {
        return(start.x)
    }
} 

// get a line from two points

const getLine = function(start, end, options = {}){
    let width = end.x - start.x 
    let height = end.y - start.y
    let startValue = start.y
    let startXValue = start.x
    let slope = Math.abs(width) > 1E-5 ? height / width : null;

    if (options.force) {
        // consider width as the x-variable whichever way this is seen
        width = slope === null ? height : width;
        startXValue = slope === null ? start.y : start.x
        if (options.xComponent){
            height = options.force.xForceEnd - options.force.xForceStart
            slope = height / width
            startValue = options.force.xForceStart
        } else if (options.yComponent){
            height = options.force.yForceEnd - options.force.yForceStart
            slope = height / width
            startValue = options.force.yForceStart
        }
    }
    if (slope !== null){
        return({
            slope: slope,
            intercept: (0-startXValue) * slope + startValue
        })
    } else {
        return({
            slope: null,
            intercept: null
        })
    }
}

export const equivalentDistributedForce = function(start, end, force){
    let xForce = {location: {}}
    let yForce = {location: {}}
    let width = end.x - start.x
    const memberLine = getLine(start, end);
    const xForceLine = getLine(start, end, {force: force, xComponent: true})
    const yForceLine = getLine(start, end, {force: force, yComponent: true})
    let xCentroid = null 
    let yCentroid = null 
    // if vertical
    if (Math.abs(width)<1E-5){
        xCentroid = getCentroid(xForceLine, start.y, end.y)
        yCentroid = getCentroid(yForceLine, start.y, end.y)
    // if horizontal
    } else {
        xCentroid = getCentroid(xForceLine, start.x, end.x)
        yCentroid = getCentroid(yForceLine, start.x, end.x)
    }
    const equivForce = resultantForce(force, start, end);
    xForce.location.x = xCentroid
    xForce.location.y = getPosOnLine(memberLine, start, xCentroid)
    xForce.amount = equivForce.x
    yForce.location.x = yCentroid
    yForce.location.y = getPosOnLine(memberLine, start, yCentroid)
    yForce.amount = equivForce.y
    return({xForce: xForce, yForce: yForce})
} 

const resultantForce = function(force, start, end){
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)
    if (Math.abs(width) > 1E-5){
        return ({
            x: (force.xForceStart + force.xForceEnd) / 2 * width,
            y: (force.yForceStart + force.yForceEnd) / 2 * width
        })
    } else {
        return ({
            x: (force.xForceStart + force.xForceEnd) / 2 * height,
            y: (force.yForceStart + force.yForceEnd) / 2 * height
        })
    }
}

// get the centroid formed by a given line under distributed force
// start and end are just the 'x' value at the start and end
const getCentroid = function(line, start, end){
    if (line.slope === 0){
        return (start+end)/2
    } else {
        return(
            (line.slope / 3 * (end ** 3 - start ** 3) +
            line.intercept/2 * (end ** 2 - start ** 2)) / 
            (line.slope / 2 * (end ** 2 - start ** 2) +
            line.intercept * (end - start))
        )
    }
}

// get location on member by percentage
const memberForceLocation = function(member, percentage){
    let nodeA = this.props.nodes[member.nodeA]
    let nodeB = this.props.nodes[member.nodeB]
    const width = (nodeB.x - nodeA.x)
    const height = (nodeB.y - nodeA.y)
    return({
        x: nodeA.x + width * percentage / 100,
        y: nodeA.y + height * percentage / 100
    })    
}

const numberOfReactions = function(supports, nodes){
    let number = 0;
    Object.keys(supports).map(key => {
        const support = supports[key]
        const node = nodes[support.node]
        const memberNumber = node.members.length
        for (let i = 0 ; i < memberNumber ; i++){
            const member = node.members[i];
            if (support.supportType === 'fixed'){
                number += 3;
            } else if (support.supportType === 'pinned'){
                number += 2;
            } else if (support.supportType === 'xRoller' || support.supportType === 'yRoller'){
                number += 1;
            }  
        }
    })
    return number
}