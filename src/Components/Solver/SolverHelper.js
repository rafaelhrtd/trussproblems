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
    const members = this.props.members === undefined ? {} : this.props.members;
    const moments = this.props.moments === undefined ? {} : this.props.moments;
    const sections = getSections.bind(this)() 
    // moments
    const connections = getConnections(sections);
    const unknownMoments = sectionAMoments(supports, sections, connections, nodes)
    const unknownForces = forceVectors(sections, nodes, supports, connections);
    const knownForces = resultantForceVector.bind(this)(nodes, sections, connections, forces)
    const knownMoments = resultantMomentVector.bind(this)(connections, sections)

    if (isTruss(nodes, members)){
        const aMatrix = trussAMatrix(nodes, members, supports);
        const bMatrix = trussBMatrix(nodes, forces);
        const solution = solve(aMatrix, bMatrix);
        this.props.addSolutionErrors(null);
        this.props.addTrussCheck(true);
        this.props.addSupportReactions(getSupportReactions(nodes, supports, solution));
    // frames solved here
    } else if (frameSolvable(nodes, members, supports) === "solvable") {
        const aMatrix = frameAMatrix(nodes, members, supports);
        const bVector = frameBVector(nodes, members, forces, moments, supports);
        console.log('bVector')
        console.log(bVector)
        const solution = solve(aMatrix, bVector);
        let memberReactions = getMemberReactions(members, nodes, supports, solution);
        memberReactions = getDataPoints(memberReactions, members, nodes, forces);
        this.props.addSupportReactions(getSupportReactions(nodes, supports, solution));
        this.props.addMemberReactions(memberReactions);
        console.log('solution');
        console.log(solution);
        this.props.addSolutionErrors(null);
        this.props.addTrussCheck(false);
    }
}

const getDataPoints = function(memberReactions, members, nodes, forces){
    Object.keys(members).map(key => {
        const member = members[key];
        const memberReaction = memberReactions[key];
        const nodeA = nodes[member.nodeA];
        const nodeB = nodes[member.nodeB];
        const angle = interNodalAngle(nodeA, nodeB);
        const length = memberLength(member, nodes);
        const data = {n: [], s: [], m: []};
        // negative sign for sign convention
        data.m.push({x: 0, y: memberReaction.nodeA.m ? -memberReaction.nodeA.m : 0, point: true});
        
        // external forces
        const orderedForces = member.forces.map(forceKey => {
            const force = forces[forceKey];
            if (force.forceType === 'distributed'){
                force.x = length * force.startPoint / 100;
                force.start = length * force.startPoint / 100;
                force.end = length * force.endPoint / 100;
                force.nForceStart = (force.xForceStart * Math.cos(angle) + force.yForceStart * Math.sin(angle)) * Math.cos(angle);
                force.nForceEnd = (force.xForceEnd * Math.cos(angle) + force.yForceEnd * Math.sin(angle)) * Math.cos(angle);
                force.sForceStart = (- force.xForceStart * Math.sin(angle) + force.yForceStart * Math.cos(angle)) * Math.cos(angle);
                force.sForceEnd = (- force.xForceEnd * Math.sin(angle) + force.yForceEnd * Math.cos(angle)) * Math.cos(angle);
            } else {
                force.x = length * force.location / 100;
                force.n = -(force.xForce * Math.cos(angle) + force.yForce * Math.sin(angle));
                force.s = - force.xForce * Math.sin(angle) + force.yForce * Math.cos(angle);
            }
            return (force);
        }).sort((a,b) => a.x <= b.x ? 1 : -1);
        for (let i = 0; i < orderedForces.length ; i++){
            const force = orderedForces[i];
            if (force.forceType === 'distributed'){
                const steps = 2000;
                const distance = force.end - force.start;
                const dx = (force.end - force.start) / steps;
                let location = force.start;
                const nLine = linearEquation(distance, force.nForceStart, force.nForceEnd, {steps: steps});
                console.log('nLine')
                console.log(nLine)
                console.log(force);
                const sLine = linearEquation(distance, force.sForceStart, force.sForceEnd, {steps: steps});
                // first point
                data.n.push({x: location, y: -(nLine.m * (dx/4) + nLine.b) * dx / 2});
                let total = 0
                data.s.push({x: location, y: (sLine.m * (dx/4) + sLine.b) * dx / 2}); 
                total += (sLine.m * (dx/4) + sLine.b) * dx / 2;
                //middle points
                let counter = 0;
                for (let i = 0 ; i < steps - 1; i++){
                    location += dx;
                    counter++;
                    data.n.push({x: location, y: -(nLine.m * location + nLine.b) * dx});
                    data.s.push({x: location, y: (sLine.m * location + sLine.b) * dx});
                    total += (sLine.m * location + sLine.b) * dx                
                }
                // last points
                data.n.push({x: (force.start + distance), y: -(nLine.m * (distance-dx/4) + nLine.b) * dx / 2});
                data.s.push({x: (force.start + distance), y: (sLine.m * (distance-dx/4) + sLine.b) * dx / 2}); 
                total += (sLine.m * (distance-dx/4) + sLine.b) * dx / 2;
            } else {
                data.n.push({x: force.x, y: force.n, point: true});
                data.s.push({x: force.x, y: force.s, point: true});
            }
        }
        data.m = [...data.m, {x: length, y: memberReaction.nodeB.m ? memberReaction.nodeB.m : 0}]
        
        // sort them from left to right
        data.n.sort((a,b) => a.x >= b.x ? 1 : -1);
        data.s.sort((a,b) => a.x >= b.x ? 1 : -1);

        // Add node forces
        data.n = [{x: 0, y: memberReaction.nodeA.n, point: true}, ...data.n, {x: length, y: memberReaction.nodeB.n}];
        data.s = [{x: 0, y: memberReaction.nodeA.s, point: true}, ...data.s, {x: length, y: memberReaction.nodeB.s}];
        
        // aggregate forces
        Object.keys(data).map(cat => {
            if (cat !== 'm'){
                for (let i = 1 ; i < data[cat].length ; i++){
                    data[cat][i].y += data[cat][i-1].y;
                }
            }
        })
        

        let finalData = {n: [], s: [], m: []};

        finalData.m.push({...data.m[0]});
        // get moments
        for (let i = 1 ; i < data.s.length; i++){
            finalData.m.push({
                x: data.s[i].x,
                y: data.s[i-1].y * (data.s[i].x-data.s[i-1].x)
            });
        }
        // aggregate moments
        for (let i = 1 ; i < finalData.m.length ; i++){
            finalData.m[i].y += finalData.m[i-1].y;
        }
        // moment at final point does not need to be added

        // extend forces
        Object.keys(data).map(cat => {
            let counter = 0;
            if (cat !== 'm'){
                for (let i = 0 ; i < data[cat].length ; i++){
                    finalData[cat].push(data[cat][i]);
                    if (data[cat][i].point){
                        counter++;
                        finalData[cat].push({...data[cat][i]});
                        console.log(data);
                        finalData[cat][i+counter].x = data[cat][i+1].x;
                    }
                }
            }
        })

        memberReactions[member.id].data = finalData;
    })
    return memberReactions;
}


const memberLength = function(member, nodes){
    const nodeA = nodes[member.nodeA];
    const nodeB = nodes[member.nodeB];
    const distance = interNodalDistance(nodeA, nodeB);
    return ((distance.x) ** 2 + (distance.y) ** 2) ** 0.5;
}

const linearEquation = function(distance, start, end, options = {}){
    let slope = (end - start) / distance;
    let intercept = start;
    return {m: slope, b: intercept}
}

const canTransmitMoment = function(node, connections, supports){
    if (connections[node.id]){
        return false;
    }
    if (node.members.length === 1 && node.connectionType === 'pinned'){
        return false;
    }
    if (node.members.length === 1 && node.support && supports[node.support].supportType !== 'fixed'){
        return false;
    }
    return true;
}


const getOtherNode = function(nodes, member, nodeA){
    return member.nodeA === nodeA.id ? nodes[member.nodeB] : nodes[member.nodeA];
}

const cleanMatrix = function(matrix){
    for (let  i = 0 ; i < matrix.length ; i++){
        for (let j = 0 ; j < matrix[i].length ; j++){
            if (Math.abs(matrix[i][j]) < 1E-7){
                matrix[i][j] = 0;
            }
        }
    }
    return matrix;
}

// to check if the structure is a truss
const isTruss = function(nodes, members){
    let truss = true;
    for (let i = 0 ; i < Object.keys(nodes).length ; i++){
        const node = nodes[Object.keys(nodes)[i]];
        if (node.connectionType === "fixed"){
            truss = false;
            break
        }
    }
    if (truss){
        for (let i = 0 ; i < Object.keys(members).length ; i++){
            const member = members[Object.keys(members)[i]];
            if (member.forces.length > 0){
                truss = false;
                break
            }
        }
    }
    return truss
}

// A matrix for trusses
const trussAMatrix = function(nodes, members, supports){
    let A = [];
    Object.keys(nodes).map(nodeKey => { 
        let nodeX = [];
        let nodeY = []
        const node = nodes[nodeKey];

        Object.keys(supports).map(supportID => {
            const support = supports[supportID];
            if (node.id === support.id){
                if (support.supportType === "fixed"){
                    nodeX = [...nodeX, 1, 0, 0];
                    nodeY = [...nodeY, 0, 1, 0];
                } else if (support.supportType === "pinned"){
                    nodeX = [...nodeX, 1, 0];
                    nodeY = [...nodeY, 0, 1];
                } else if (support.supportType === "xRoller"){
                    nodeX = [...nodeX, 1];
                    nodeY = [...nodeY, 0];
                } else if (support.supportType === "yRoller"){
                    nodeX = [...nodeX, 0];
                    nodeY = [...nodeY, 1];
                } 
            } else {
                if (support.supportType === "fixed"){
                    nodeX = [...nodeX, 0, 0, 0];
                    nodeY = [...nodeY, 0, 0, 0];
                } else if (support.supportType === "pinned"){
                    nodeX = [...nodeX, 0, 0];
                    nodeY = [...nodeY, 0, 0];
                } else if (support.supportType === "xRoller"){
                    nodeX = [...nodeX, 0];
                    nodeY = [...nodeY, 0];
                } else if (support.supportType === "yRoller"){
                    nodeX = [...nodeX, 0];
                    nodeY = [...nodeY, 0];
                } 
            }
        })
        Object.keys(members).map(memberKey => {
            const member = members[memberKey];
            const nodeB = getOtherNode(nodes, member, node);
            const angle = interNodalAngle(node, nodeB);
            if (getNodeMembers(node).includes(member.id)){
                nodeX = [...nodeX, Math.cos(angle)];
                nodeY = [...nodeY, Math.sin(angle)];
            } else {
                nodeX = [...nodeX, 0];
                nodeY = [...nodeY, 0];
            }
        })
        A = [...A, nodeX, nodeY];
    })
    return A;
}

const trussBMatrix = (nodes, forces) => {
    let B = [];
    Object.keys(nodes).map(key => {
        const node = nodes[key];
        if (node.force){
            const force = forces[node.force];
            B = [...B, -force.xForce, -force.yForce];
        } else {
            B = [...B, 0, 0];
        }
    })
    return B;
}

const getNodeMembers = function(node){
    return node.members.map(member => (member.id))
}

// relates the external forces to their supports
const solvedNodes = function(supports, solution){
    let solvedNodes = {}
    let counter = 0;
    Object.keys(supports).map(supportKey => {
        const support = supports[supportKey];
        solvedNodes[support.id] = {...support}
        let solvedSupport = solvedNodes[support.id];
        if (support.supportType === 'fixed'){
            solvedSupport.xForce = solution[counter];
            counter++;
            solvedSupport.yForce = solution[counter];
            counter++;
            solvedSupport.moment = solution[counter];
            counter++;
        } else if (support.supportType === 'pinned'){
            solvedSupport.xForce = solution[counter];
            counter++;
            solvedSupport.yForce = solution[counter];
            counter++;
        } else if (support.supportType === 'xRoller'){
            solvedSupport.xForce = solution[counter];
            solvedSupport.yForce = 0;
            counter++;
        } else if (support.supportType === 'yRoller'){
            solvedSupport.xForce = 0;
            solvedSupport.yForce = solution[counter];
            counter++;
        } 
    })
    return solvedNodes;
}

const frameAMatrix = function(nodes, members, supports){
    let A = [];
    // deal with nodes first
    Object.keys(nodes).map(key => {
        const node = nodes[key];
        const nodeHasMoment = hasMoment(node, nodes, members, supports);
        let nodeX = [];
        let nodeY = [];
        let nodeM = [];
        Object.keys(supports).map(supportKey => {
            const support = supports[supportKey];
            const reactions = supportReactions(node, support, nodes, members, supports);
            nodeX = [...nodeX, ...reactions.x];
            nodeY = [...nodeY, ...reactions.y];
            if (reactions.m){
                nodeM = [...nodeM, ...reactions.m];
            }
        })
        let canceller = 1
        Object.keys(members).map(memberKey =>{
            const member = members[memberKey];
            const nodeA = nodes[member.nodeA];
            const nodeB = nodes[member.nodeB];
            const nodeAHasMoment = hasMoment(nodeA, nodes, members, supports);
            const nodeBHasMoment = hasMoment(nodeB, nodes, members, supports);
            if (nodeAHasMoment){
                if (nodeA.id === node.id){
                    nodeX = [...nodeX, -1, 0, 0];
                    nodeY = [...nodeY, 0, -1, 0];
                    nodeM = [...nodeM, 0, 0, -1];
                } else {
                    nodeX = [...nodeX, 0, 0, 0];
                    nodeY = [...nodeY, 0, 0, 0];
                    nodeM = [...nodeM, 0, 0, 0];
                }
            } else {
                if (nodeA.id === node.id){
                    nodeX = [...nodeX, -1, 0];
                    nodeY = [...nodeY, 0, -1];
                    nodeM = [...nodeM, 0, 0]
                } else {
                    nodeX = [...nodeX, 0, 0];
                    nodeY = [...nodeY, 0, 0];
                    nodeM = [...nodeM, 0, 0]
                }
            }
            if (nodeBHasMoment){
                if (nodeB.id === node.id){
                    nodeX = [...nodeX, -1, 0, 0];
                    nodeY = [...nodeY, 0, -1, 0];
                    nodeM = [...nodeM, 0, 0, -1];
                } else {
                    nodeX = [...nodeX, 0, 0, 0];
                    nodeY = [...nodeY, 0, 0, 0];
                    nodeM = [...nodeM, 0, 0, 0];
                }
            } else {
                if (nodeB.id === node.id){
                    nodeX = [...nodeX, -1, 0];
                    nodeY = [...nodeY, 0, -1];
                    nodeM = [...nodeM, 0, 0]
                } else {
                    nodeX = [...nodeX, 0, 0];
                    nodeY = [...nodeY, 0, 0];
                    nodeM = [...nodeM, 0, 0]
                }
            }
        })
        A = [...A, nodeX, nodeY];
        if (nodeHasMoment){
            A = [...A, nodeM];
        }
    })
    Object.keys(members).map(key => {
        const member = members[key];
        let memberX = [];
        let memberY = [];
        let memberM = [];
        for (let i = 0; i < numberOfReactions(supports) ; i++){
            memberX = [...memberX, 0]
            memberY = [...memberY, 0]
            memberM = [...memberM, 0]
        }
        Object.keys(members).map(innerKey => {
            const innerMember = members[innerKey];
            const nodeA = nodes[innerMember.nodeA];
            const nodeB = nodes[innerMember.nodeB];
            const nodeAHasMoment = hasMoment(nodeA, nodes, members, supports);
            const nodeBHasMoment = hasMoment(nodeB, nodes, members, supports);
            if (innerMember.id === member.id){
                const distance = interNodalDistance(nodeA, nodeB);
                if (nodeAHasMoment){
                    memberX = [...memberX, 1, 0, 0]
                    memberY = [...memberY, 0, 1, 0]
                    memberM = [...memberM, 0, 0, 1]
                } else {
                    memberX = [...memberX, 1, 0]
                    memberY = [...memberY, 0, 1]
                    memberM = [...memberM, 0, 0]
                }
                if (nodeBHasMoment){
                    memberX = [...memberX, 1, 0, 0]
                    memberY = [...memberY, 0, 1, 0]
                    memberM = [...memberM, -distance.y, distance.x, 1]
                } else {
                    memberX = [...memberX, 1, 0]
                    memberY = [...memberY, 0, 1]
                    memberM = [...memberM, -distance.y, distance.x]
                }
            } else {
                if (nodeAHasMoment){
                    memberX = [...memberX, 0, 0, 0]
                    memberY = [...memberY, 0, 0, 0]
                    memberM = [...memberM, 0, 0, 0]
                } else {
                    memberX = [...memberX, 0, 0]
                    memberY = [...memberY, 0, 0]
                    memberM = [...memberM, 0, 0]
                }
                if (nodeBHasMoment){
                    memberX = [...memberX, 0, 0, 0]
                    memberY = [...memberY, 0, 0, 0]
                    memberM = [...memberM, 0, 0, 0]
                } else {
                    memberX = [...memberX, 0, 0]
                    memberY = [...memberY, 0, 0]
                    memberM = [...memberM, 0, 0]
                }
            }
        })
        A = [...A, memberX, memberY, memberM];
    })
    return A;
}

const frameBVector = function(nodes, members, forces, moments, supports){
    let B = [];
    Object.keys(nodes).map(key => {
        const node = nodes[key];
        if (node.force){
            const force = forces[node.force];
            B = [...B, -force.x, -force.y]
        } else {
            B = [...B, 0, 0];
        }
        if (hasMoment(node, nodes, members, supports)){
            if (node.moment){
                const moment = moments[node.moment];
                B = [...B, -moment.moment]
            } else {
                B = [...B, 0];
            }
        }
    })
    Object.keys(members).map(memberID => {
        const member = members[memberID];
        const memberForce = {
            x: 0,
            y: 0,
            m: 0
        }
        member.forces.map(forceID => {
            const force = forces[forceID];
            const nodeA = nodes[member.nodeA];
            if (force.forceType === 'point'){
                const fLocation = forceLocation(force, nodes, members)
                const distance = {
                    x: fLocation.x - nodeA.x,
                    y: fLocation.y - nodeA.y
                }
                memberForce.x += force.xForce
                memberForce.y += force.yForce
                memberForce.m += force.yForce * distance.x;
                memberForce.m -= force.xForce * distance.y;

            } else if (force.forceType === 'distributed'){
                const equivForce = forceLocation(force, nodes, members)
                const distance = {
                    x: equivForce.yForce.location.x - nodeA.x,
                    y: equivForce.xForce.location.y - nodeA.y
                }
                memberForce.x += equivForce.xForce.amount
                memberForce.y += equivForce.yForce.amount
                memberForce.m += equivForce.yForce.amount * distance.x;
                memberForce.m -= equivForce.xForce.amount * distance.y;
            }
        })
        member.moments.map(momentID => {
            const moment = moments[momentID];
            memberForce.m += moment.moment
        })
        B = [...B, -memberForce.x, -memberForce.y, -memberForce.m]
    })
    return B;
}

const getMemberReactions = function(members, nodes, supports, solution){
    let reacNumber = numberOfReactions(supports);
    let counter = reacNumber;
    let memberReactions = {};
    Object.keys(members).map(key => {
        const member = members[key];
        const angle = interNodalAngle(nodes[member.nodeA], nodes[member.nodeB]);
        let reactionMember = {...member};
        reactionMember.nodeA = {};
        reactionMember.nodeB = {};
        let xForce = solution[counter];
        counter++;
        let yForce = solution[counter];
        counter++;
        // add normal and shear forces
        reactionMember.nodeA.n = -(xForce * Math.cos(angle) + yForce * Math.sin(angle));
        reactionMember.nodeA.s = - xForce * Math.sin(angle) + yForce * Math.cos(angle);
        if (hasMoment(nodes[member.nodeA], nodes, members, supports)){
            reactionMember.nodeA.m = solution[counter];
            counter++;
        };
        xForce = solution[counter];
        counter++;
        yForce = solution[counter];
        counter++;
        // add normal and shear forces
        reactionMember.nodeB.n = -(xForce * Math.cos(angle) + yForce * Math.sin(angle));
        reactionMember.nodeB.s = - xForce * Math.sin(angle) + yForce * Math.cos(angle);
        if (hasMoment(nodes[member.nodeB], nodes, members, supports)){
            reactionMember.nodeB.m = solution[counter];
            counter++;
        };
        memberReactions[member.id] = reactionMember;
    })
    return memberReactions
}

// set the reactions at the supports
const getSupportReactions = function(nodes, supports, solution){
    let nodeReactions = {};
    let counter = 0;
    Object.keys(supports).map(key => {
        const support = supports[key];
        const node = nodes[support.node];
        nodeReactions[node.id] = {};
        const reaction = nodeReactions[node.id];
        reaction.node = node.id;
        if (support.supportType === "fixed"){
            reaction.xForce = solution[counter];
            counter++;
            reaction.yForce = solution[counter];
            counter++; 
            reaction.moment = solution[counter];
            counter++
        } else if (support.supportType === "pinned"){
            reaction.xForce = solution[counter];
            counter++;
            reaction.yForce = solution[counter];
            counter++; 
        } else if (support.supportType === "xRoller"){
            reaction.xForce = solution[counter];
            counter++;
            reaction.yForce = 0;
        } else if (support.supportType === "yRoller"){
            reaction.xForce = 0;
            reaction.yForce = solution[counter];
            counter++; 
        }
    })
    return nodeReactions;
}

const hasMoment = function(node, nodes, members, supports){
    return (node.connectionType === 'fixed' &&
    (node.members.length > 1 || node.moment ||
    (node.support &&
     supports[node.support].supportType === "fixed")))
}

const supportReactions = function(node, support, nodes, members, supports, options = {}){
    let reactions = {
        x: null,
        y: null,
        m: null
    }
    if (hasMoment(node, nodes, members, supports)){
        if (support.node === node.id){
            if (support.supportType === "fixed"){
                reactions.x = [1, 0, 0];
                reactions.y = [0, 1, 0];
                reactions.m = [0, 0, 1];
            } else if (support.supportType === "pinned"){
                reactions.x = [1, 0];
                reactions.y = [0, 1];
                reactions.m = [0, 0];
            } else if (support.supportType === "xRoller"){
                reactions.x = [1];
                reactions.y = [0];
                reactions.m = [0];
            } else if (support.supportType === "yRoller"){
                reactions.x = [0];
                reactions.y = [1];
                reactions.m = [0];
            } 
        } else {
            if (support.supportType === "pinned"){
                reactions.x = [0, 0];
                reactions.y = [0, 0];
                reactions.m = [0, 0];
            } else if (support.supportType === "xRoller"){
                reactions.x = [0];
                reactions.y = [0];
                reactions.m = [0];
            } else if (support.supportType === "yRoller"){
                reactions.x = [0];
                reactions.y = [0];
                reactions.m = [0];
            } 
        }
    } else {
        if (support.node === node.id){
            if (support.supportType === "pinned"){
                reactions.x = [1, 0];
                reactions.y = [0, 1];
            } else if (support.supportType === "xRoller"){
                reactions.x = [1];
                reactions.y = [0];
            } else if (support.supportType === "yRoller"){
                reactions.x = [0];
                reactions.y = [1];
            } 
        } else {
            if (support.supportType === "pinned"){
                reactions.x = [0, 0];
                reactions.y = [0, 0];
            } else if (support.supportType === "xRoller"){
                reactions.x = [0];
                reactions.y = [0];
            } else if (support.supportType === "yRoller"){
                reactions.x = [0];
                reactions.y = [0];
            } 
        }
    }
    return reactions
}

const frameSolvable = function(nodes, members, supports){
    let nodeNumber = Object.keys(nodes).length;
    let memberNumber = Object.keys(members).length;
    let hingeNumber = 0;
    let reactionNumber = 0;
    Object.keys(supports).map(key => {
        const support = supports[key];
        if (support.supportType === 'fixed'){
            reactionNumber += 3;
        } else if (support.supportType === 'pinned'){
            reactionNumber += 2;
        } else {
            reactionNumber += 1;
        }
    })
    Object.keys(nodes).map(key => {
        const node = nodes[key];
        if (node.connectionType === 'pinned'){
            hingeNumber += 1;
        }
    })
    if (3 * memberNumber + reactionNumber - 3 * nodeNumber - hingeNumber < 0){
        return "overdetermined";
    }
    if (3 * memberNumber + reactionNumber - 3 * nodeNumber - hingeNumber > 0){
        return "unstable";
    }
    return "solvable";
}

// get member moment at given node
const getMemberMoment = function(member, nodeA, nodes, forces){
    return false;
}
const memberAngle = function(nodes, member){
    const nodeA = nodes[member.nodeA];
    const nodeB = nodes[member.nodeB];
    return Math.atan2((nodeB.y - nodeA.y), (nodeB.x - nodeA.x));
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
    const members = this.props.members

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
                    const equivForce = forceLocation(force, nodes, members)
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

const interNodalAngle = function(nodeA, nodeB){
    const distance = interNodalDistance(nodeA, nodeB);
    return Math.atan2(distance.y, distance.x);
}
// get resultant moments for B matrix
// include a member with reactions in the options to calculate only the internal
// moments of the member 
const resultantMomentVector = function(connections, sections, options = {}){
    const forces = this.props.forces; 
    const nodes = this.props.nodes;
    const members = this.props.members;
    const moments = this.props.moments;
    
    // if no member was provided, carry out calculations for all sections
    if (!options.member){
        let resultantMoments = [];
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
                    const fLocation = forceLocation(force, nodes, members)
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
                        const fLocation = forceLocation(force, nodes, members)
                        const distance = {
                            x: fLocation.x - momentNode.x,
                            y: fLocation.y - momentNode.y
                        }
                        sectionMoment -= force.yForce * distance.x;
                        sectionMoment += force.xForce * distance.y;
                    } else if (force.forceType === 'distributed'){
                        const equivForce = forceLocation(force, nodes, members)
                        const distance = {
                            x: equivForce.yForce.location.x - momentNode.x,
                            y: equivForce.xForce.location.y - momentNode.y
                        }
                        sectionMoment -= equivForce.yForce.amount * distance.x;
                        sectionMoment += equivForce.xForce.amount * distance.y;
                    }
                })
                member.moments.map(momentID => {
                    const moment = moments[momentID]
                    sectionMoment += moment.moment
                })
            })
            // deal with moments
            
            resultantMoments = [...resultantMoments, sectionMoment];
        })
        return resultantMoments;
    // if a member is provided
    } else {
        let resultantMoment = 0;
        const member = {...options.member}
        const momentNode = nodes[member.nodeA];
        const nodeA = nodes[member.nodeA];
        const nodeB = nodes[member.nodeB];
        member.forces.map(forceID => {
            const force = forces[forceID];
            if (force.forceType === 'point'){
                const fLocation = forceLocation(force, nodes, members)
                const distance = {
                    x: fLocation.x - momentNode.x,
                    y: fLocation.y - momentNode.y
                }
                resultantMoment += force.yForce * distance.x;
                resultantMoment -= force.xForce * distance.y;
            } else if (force.forceType === 'distributed'){
                const equivForce = forceLocation(force, nodes, members)
                const distance = {
                    x: equivForce.yForce.location.x - momentNode.x,
                    y: equivForce.xForce.location.y - momentNode.y
                }
                resultantMoment += equivForce.yForce.amount * distance.x;
                resultantMoment -= equivForce.xForce.amount * distance.y;
            }
            // get moment from opposite reaction
            resultantMoment += member.nodeBForces.y * (nodeB.x - nodeA.x);
            resultantMoment -= member.nodeBForces.x * (nodeB.y - nodeA.y);
        })
        return resultantMoment
        // skipping moments because it is already added when adding section moments;
    }
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

export const forceLocation = function(force, nodes, members){
    let location = null
    if (force.node){
        const node = nodes[force.node];
        location = {x: node.x, y: node.y};
    } else if (force.member) {
        let member = members[force.member]
        if (force.forceType === 'point'){
            location = memberForceLocation(member, force.location, nodes)
        } else if (force.forceType === 'distributed'){
            let start = memberForceLocation(member, force.startPoint, nodes)
            let end = memberForceLocation(member, force.endPoint, nodes)
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
    let xForce = {location: {}};
    let yForce = {location: {}};
    let width = end.x - start.x;
    const memberLine = getLine(start, end);
    const xForceLine = getLine(start, end, {force: force, xComponent: true});
    const yForceLine = getLine(start, end, {force: force, yComponent: true});
    let xCentroid = null;
    let yCentroid = null;
    let xPosX = null;
    let xPosY = null;
    let yPosX = null;
    let yPosY = null;
    // if vertical
    if (Math.abs(width)<1E-5){
        xCentroid = getCentroid(xForceLine, start.y, end.y);
        yCentroid = getCentroid(yForceLine, start.y, end.y);
        xPosX = start.x;
        xPosY = xCentroid;
        yPosX = start.x;
        yPosY = yCentroid;
    // if not vertical
    } else {
        xCentroid = getCentroid(xForceLine, start.x, end.x);
        yCentroid = getCentroid(yForceLine, start.x, end.x);
        xPosX = xCentroid;
        xPosY = getPosOnLine(memberLine, start, xCentroid);
        yPosX = yCentroid;
        yPosY = getPosOnLine(memberLine, start, yCentroid);
    }
    const equivForce = resultantForce(force, start, end);
    xForce.location.x = xPosX;
    xForce.location.y = xPosY;
    xForce.amount = equivForce.x;
    yForce.location.x = yPosX;
    yForce.location.y = yPosY;
    yForce.amount = equivForce.y;
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
const memberForceLocation = function(member, percentage, nodes){
    let nodeA = nodes[member.nodeA]
    let nodeB = nodes[member.nodeB]
    const width = (nodeB.x - nodeA.x)
    const height = (nodeB.y - nodeA.y)
    return({
        x: nodeA.x + width * percentage / 100,
        y: nodeA.y + height * percentage / 100
    })    
}

const numberOfReactions = function(supports){
    let number = 0;
    Object.keys(supports).map(key => {
        const support = supports[key];
        if (support.supportType === 'fixed'){
            number += 3;
        } else if (support.supportType === 'pinned'){
            number += 2;
        } else if (support.supportType === 'xRoller' || support.supportType === 'yRoller'){
            number += 1;
        }  
    })
    return number
}