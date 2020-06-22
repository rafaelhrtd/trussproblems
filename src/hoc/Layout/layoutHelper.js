export const setFocusItem = function(item, itemtype){
    if (item === null){
        this.setState({focus: null});
    } else {
        this.setState({focus: {
            type: itemtype,
            item: item
        }})
    }
}

export const deleteMember = function(id, nodes, members, forces){
    let member = {...members[id]}
    // remove dependents
    Object.keys(forces).map(key => {
        const force = forces[key]
        if (force.member === member.id){
            const newElements = deleteForce(force.id, nodes, members, forces)
            nodes = newElements.nodes
            members = newElements.members
            forces = newElements.forces     
        }
    })
    // remove from parents
    let nodeA = {...nodes[member.nodeA]}
    let nodeB = {...nodes[member.nodeB]}
    Object.keys(nodeA.members).map(index => {
        if (nodeA.members[index].id === member.id){
            nodeA.members.splice(index, 1);
        }
    })
    Object.keys(nodeB.members).map(index => {
        if (nodeB.members[index].id === member.id){
            nodeB.members.splice(index, 1);
        }
    })
    delete members[member.id]
    nodes[nodeA.id] = nodeA;
    nodes[nodeB.id] = nodeB;
    return ({members: members, nodes: nodes, forces: forces})
}

export const deleteForce = function(id, nodes, members, forces){
    let force = {...forces[id]}
    delete forces[force.id]
    // remove from parents
    let node = force.node ? {...nodes[force.node]} : null
    let member = force.member ? {...members[force.member]} : null
    if (node){
        node.force = null
        nodes[node.id] = node
    } else if (member){
        Object.keys(member.forces).map(index => {
            if (member.forces[index] === force.id){
                member.forces.splice(index, 1);
            }
        })
        members[member.id] = member
    }
    return ({members: members, nodes: nodes, forces: forces})
}


export const deleteNode = function(id, nodes, members, forces, supports){
    let node = {...nodes[id]}
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
    // delete support
    delete supports[node.support]

    delete nodes[node.id]
    return({nodes: nodes, members: members, forces: forces, supports: supports})
}