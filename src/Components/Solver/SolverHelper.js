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

export const linearEquationSystem = function(){
    const nodes = this.props.nodes  === undefined ? {} : this.props.nodes
    const supports = this.props.supports === undefined ? {} : this.props.supports
    const forces = this.props.forces === undefined ? {} : this.props.forces;
    const members = this.props.members === undefined ? {} : this.props.members;
    const moments = this.props.moments === undefined ? {} : this.props.moments;
    if (Object.keys(forces).length === 0 && Object.keys(moments).length === 0){
        this.props.addSolutionErrors({
            truss: "No forces or moments have been entered. Nothing to solve."
        }, {frame: false, truss: false});
    }
    if (isTruss(nodes, members)){
        const aMatrix = trussAMatrix(nodes, members, supports);
        const bMatrix = trussBMatrix(nodes, forces);
        const solution = solve(aMatrix, bMatrix);
        this.props.addSolutionErrors(null, {frame: false, truss: true});
        this.props.addTrussCheck(true);
        this.props.addSupportReactions(getSupportReactions(nodes, supports, solution));
        this.props.addMemberReactions(addTrussReactions(members, solution, supports));
    // frames solved here
    } else if (frameSolvable(nodes, members, supports) === "solvable") {
        const aMatrix = frameAMatrix(nodes, members, supports);
        const bVector = frameBVector(nodes, members, forces, moments, supports);
        const solution = solve(aMatrix, bVector);
        let memberReactions = getMemberReactions(members, nodes, supports, solution);
        memberReactions = getDataPoints(memberReactions, members, nodes, forces);
        this.props.addSupportReactions(getSupportReactions(nodes, supports, solution));
        this.props.addMemberReactions(memberReactions);
        this.props.addSolutionErrors(null, {frame: true, truss: false});
        this.props.addTrussCheck(false);
    } else {
        if (!allNodesConnected.bind(this)()){
            this.props.addSolutionErrors({
                truss: "The structure entered is neither a truss nor a frame. Make sure all the nodes are connected."
            }, {frame: false, truss: false});
        } else {
            this.props.addSolutionErrors({
                frame: "The frame entered is " + frameSolvable(nodes, members, supports) + ". Please make sure your structure is a stable and determined one." 
            }, {frame: false, truss: false});
        }
    }
}

const addTrussReactions = function (members, solution, supports){
    const memberReactions = {...members};
    for (let i = numberOfReactions(supports); i < solution.length ; i++){
        const member = memberReactions[Object.keys(members)[i - numberOfReactions(supports)]];
        member.internalForce = Math.abs(solution[i]) > 1E-8 ? solution[i] : 0;
    };  
    return memberReactions;
}

const getDataPoints = function(memberReactions, members, nodes, forces){
    Object.keys(members).map(key => {
        let equations = {};
        let equationCounter = 1;
        equations.s = {};
        equations.n = {};
        equations.m = {};
        const member = members[key];
        const memberReaction = memberReactions[key];
        const nodeA = nodes[member.nodeA];
        const nodeB = nodes[member.nodeB];
        const angle = interNodalAngle(nodeA, nodeB);
        const length = memberLength(member, nodes);
        const data = {n: [], s: [], m: []};

        // add initial equations
        equations.s[equationCounter] = ({
            variables: {
                0: memberReaction.nodeA.s
            },
            start: 0,
            end: length
        })
        equations.n[equationCounter] = ({
            variables: {
                0: memberReaction.nodeA.n
            },
            start: 0,
            end: length
        })
        equations.m[1] = ({
            variables: {
                0: memberReaction.nodeA.m ? -memberReaction.nodeA.m : 0
            },
            start: 0,
            end: length
        })
        equationCounter++;
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
                equations.s[equationCounter] = (integrateEquation(getLinearEquation(force.start,force.end, force.sForceStart, force.sForceEnd)));
                equations.n[equationCounter] = (integrateEquation(getLinearEquation(force.start,force.end, -force.nForceStart, -force.nForceEnd)));
                equationCounter++;
            } else {
                force.x = length * force.location / 100;
                force.n = -(force.xForce * Math.cos(angle) + force.yForce * Math.sin(angle));
                force.s = - force.xForce * Math.sin(angle) + force.yForce * Math.cos(angle);
                equations.s[equationCounter] = ({
                    variables: {
                        0: force.s,
                    },
                    start: force.x,
                    end: length
                });
                equations.n[equationCounter] = ({
                    variables: {
                        0: force.n,
                    },
                    start: force.x,
                    end: length
                });
                equationCounter++;
            }
            return (force);
        }).sort((a,b) => a.x <= b.x ? 1 : -1);

        // add last equations
        equations.s[equationCounter] = {
            variables: {
                0: memberReaction.nodeB.s
            },
            start: length,
            end: length
        }
        equations.n[equationCounter] = {
            variables: {
                0: memberReaction.nodeB.n
            },
            start: length,
            end: length
        }

        // join equations for forces
        equations.n = {...joinEquations(equations.n, {})}
        equations.s = {...joinEquations(equations.s, {})}

        // add rest of moment equations
        Object.keys(equations.s).map(key => {
            if (equations.s[key].start !== equations.s[key].end){
                equations.m[parseInt(key) + 1] = integrateEquation(equations.s[key]);
            }
        })

        // add last moment equation\
        equations.m[Object.keys(equations.m).length+1] = {
            variables: {
                0: memberReaction.nodeB.m ? -memberReaction.nodeB.m : 0
            },
            start: length,
            end: length
        }
        // join moment equations
        equations.m = {...joinEquations(equations.m, {})}

        equationCounter++;

        memberReactions[member.id].equations = removeZeroes(equations);
        Object.keys(equations).map(reaction => {
            const reactionEquations = equations[reaction];
            Object.keys(reactionEquations).map(equationKey => {
                const equation = reactionEquations[equationKey];
                if (Math.abs(equation.start - equation.end) < 1E-8){
                    data[reaction].push({x: equation.start, y: evaluateEquation(equation, equation.start)});
                } else {
                    const xArray = linSpace(equation.start, equation.end, 100);
                    for (let i = 0 ; i < xArray.length ; i++){
                        const x = xArray[i]
                        data[reaction].push({x: x, y: evaluateEquation(equation, x)});
                    }
                }
            })
        })

        memberReactions[member.id].data = data;
    }) 
    return memberReactions;
}

const linSpace = function(startValue, stopValue, cardinality) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
        arr.push(startValue + (step * i));
    }
    return arr;
}


const removeZeroes = function(equations){
    Object.keys(equations).map(reactionKey => {
        const reactions = equations[reactionKey];
        Object.keys(reactions).map(equationKey => {
            const eq = reactions[equationKey];
            Object.keys(eq.variables).map(varKey => {
                if (Math.abs(eq.variables[varKey]) < 1E-8){
                    if (parseInt(varKey) === 0){
                        eq.variables[varKey] = 0;
                    } else {
                        delete eq.variables[varKey];
                    }
                }
            })
        })
    })
    return equations;
}

// checks if two sets of variables are the same
const variablesAreSame = function(varA, varB){
    for (let i = 0 ; i < Object.keys(varA).length ; i++){
        const key = Object.keys(varA)[i];
        if (!varB[key]) {varB[key] = 0}
        if (Math.abs(varA[key] - varB[key]) > 1E-8) { return false }
    }
    for (let i = 0 ; i < Object.keys(varB).length ; i++){
        const key = Object.keys(varB)[i];
        if (!varA[key]) {varA[key] = 0}
        if (Math.abs(varA[key] - varB[key]) > 1E-8) { return false }
    }
    return true;
}

// copy equations
const copyEquations = function(equations){
    equations = {...equations};
    Object.keys(equations).map(reactionType => {
        const reactionEquations = equations[reactionType];
        Object.keys(reactionEquations).map(equationKey => {
            const equation = reactionEquations[equationKey];
            equation.variables = {...equation.variables};
        })
    })
    return equations;
}

// join equations
const joinEquations = function(equations, options = {}){
    options.counter = options.counter ? options.counter : 0;
    options.counter++;
    // remove included flag
    for (let i = 0; i < Object.keys(equations).length; i++){
        delete equations[Object.keys(equations)[i]].included;
    }
    if (options.counter < 6){
        
        equations = {...equations};
        Object.keys(equations).map(key => {
            equations[key].variables = {...equations[key].variables}
        })
        let joinedEquations = {
        }
        let counter = 1
        let foundOverlap = false;
        for (let i = 0; i < Object.keys(equations).length ; i++){
            const outerEquation = equations[Object.keys(equations)[i]]
            if (foundOverlap){ break; }
            for (let j = 0; j < Object.keys(equations).length ; j++){
                const innerEquation = equations[Object.keys(equations)[j]]
                if (outerEquation !== innerEquation && outerEquation.start !== outerEquation.end && innerEquation.start !== innerEquation.end && innerEquation.start !== outerEquation.end){
                    if (innerEquation.start >= outerEquation.start && innerEquation.start <= outerEquation.end){
                        foundOverlap = true;
                        // if inner equation starts at outer start
                        innerEquation.included = true;
                        outerEquation.included = true;
                        if (innerEquation.start === outerEquation.start){
                            // if the inner equation ends within the outer one
                            if (innerEquation.end < outerEquation.end){
                                joinedEquations[counter] = {
                                    start: outerEquation.start,
                                    end: innerEquation.end,
                                    variables: {...addEquations(innerEquation, outerEquation)}
                                }
                                counter++;
                                joinedEquations[counter] = {
                                    start: innerEquation.end,
                                    end: outerEquation.end,
                                    variables: {...outerEquation.variables}
                                }
                                const prevEq = joinedEquations[counter-1];
                                joinedEquations[counter].variables[0] += evaluateEquation(innerEquation, innerEquation.end);
                                counter++;
                                break;
        
                            // if inner equation goes past outer end
                            } else if (innerEquation.end > outerEquation.end) {
                                joinedEquations[counter] = {
                                    start: outerEquation.start,
                                    end: outerEquation.end,
                                    variables: {...addEquations(innerEquation, outerEquation)}
                                }
                                counter++;
                                joinedEquations[counter] = {
                                    start: outerEquation.end,
                                    end: innerEquation.end,
                                    variables: {...innerEquation.variables}
                                }
                                joinedEquations[counter].variables[0] += evaluateEquation(outerEquation, outerEquation.end);
                                counter++;
                                break;
        
                            // if inner equation ends at the outer end
                            } else {
                                joinedEquations[counter] = {
                                    start: outerEquation.start,
                                    end: outerEquation.end,
                                    variables: {...addEquations(innerEquation, outerEquation)}
                                }
                                counter++;
                                break;
                            }
                        // if inner equation starts in the middle of outer
                        } else {
                            // if the inner equation ends within the outer one
                            if (innerEquation.end < outerEquation.end){
                                joinedEquations[counter] = {
                                    start: outerEquation.start,
                                    end: innerEquation.start,
                                    variables: {...outerEquation.variables}
                                }
                                counter++;
                                joinedEquations[counter] = {
                                    start: innerEquation.start,
                                    end: innerEquation.end,
                                    variables: {...addEquations(innerEquation, outerEquation)}
                                }
                                counter++
                                joinedEquations[counter] = {
                                    start: innerEquation.end,
                                    end: outerEquation.end,
                                    variables: {...outerEquation.variables}
                                }
                                joinedEquations[counter].variables[0] += evaluateEquation(innerEquation, innerEquation.end);
                                counter++;
                                break;
        
                            // if inner equation goes past outer end
                            } else if (innerEquation.end > outerEquation.end) {
                                joinedEquations[counter] = {
                                    start: outerEquation.start,
                                    end: innerEquation.start,
                                    variables: {...outerEquation.variables}
                                }
                                counter++;
                                joinedEquations[counter] = {
                                    start: innerEquation.start,
                                    end: outerEquation.end,
                                    variables: {...addEquations(innerEquation, outerEquation)}
                                }
                                counter++
                                joinedEquations[counter] = {
                                    start: outerEquation.end,
                                    end: innerEquation.end,
                                    variables: {...innerEquation.variables}
                                }

                                joinedEquations[counter].variables[0] += evaluateEquation(outerEquation, outerEquation.end);
                                counter++;
                                break;
        
                            // if inner equation ends at the outer end
                            } else {
                                joinedEquations[counter] = {
                                    start: outerEquation.start,
                                    end: innerEquation.start,
                                    variables: {...outerEquation.variables}
                                }
                                counter++;
                                joinedEquations[counter] = {
                                    start: innerEquation.start,
                                    end: outerEquation.end,
                                    variables: {...addEquations(innerEquation, outerEquation)}
                                }
                                counter++;
                                break;
        
                            }

                        }

                    }
                }
            }
        }
        if (foundOverlap){
            Object.keys(equations).map(key => {
                const eq = equations[key];
                if (!eq.included){
                    joinedEquations[counter] = {...eq};
                    counter++;
                }
            })
            return joinEquations(joinedEquations, {counter: options.counter});
        } else {
            // add to last equation
            for (let i = 0 ; i < Object.keys(equations).length ; i++){
                const eq = equations[Object.keys(equations)[i]];
                if (eq.start === eq.end){
                    for (let j = 0 ; j < Object.keys(equations).length ; j++){
                        const prevEq = equations[Object.keys(equations)[j]];
                        if (prevEq !== eq && prevEq.end === eq.start){
                            eq.variables[0] += evaluateEquation(prevEq, prevEq.end);
                        }
                    }

                }
            }
            // order equations by start
            let orderedEquations = Object.keys(equations).map(key => (equations[key]));
            orderedEquations.sort((a, b) => {
                if (a.start > b.start){
                    return 1
                } else if (a.start === b.start) {
                    if (a.end < b.end){
                        return 1;
                    } else {
                        return -1;
                    }
                } else {
                    return -1;
                }
            })
            let finalEquations = {};
            for (let i = 0 ; i < orderedEquations.length ; i++){
                finalEquations[i+1] = orderedEquations[i];
            }
            return finalEquations;        
        }
    }
}

const addEquations = function(a, b){
    let variables = {};
    Object.keys(a.variables).map(variable => {
        if (variables[variable]){
            variables[variable] += a.variables[variable];
        } else {
            variables[variable] = a.variables[variable];
        }
    });
    Object.keys(b.variables).map(variable => {
        if (variables[variable]){
            variables[variable] += b.variables[variable];
        } else {
            variables[variable] = b.variables[variable];
        }
    });
    return variables;
}

const evaluateEquation = function(equation, x){
    let result  = 0;
    Object.keys(equation.variables).map(order => {
        order = parseInt(order);
        if (order === 0 ){
            result += equation.variables[order];
        } else {
            result += equation.variables[order] * (x ** order);
        }
    })
    return result;
}

// returns linear equation giving range and value of orders
const getLinearEquation = function(start, end, fStart, fEnd){
    const m = (fEnd - fStart) / (end - start);
    const b = fStart - m * (start);
    return {
        start: start,
        end: end,
        variables: {
            0: b,
            1: m
        }
    }
}

const integrateEquation = function(equation){
    let integratedEquation = {
        start: equation.start,
        end: equation.end,
        variables: {}
    }
    Object.keys(equation.variables).map(key => {
        const order = parseInt(key)
        integratedEquation.variables[order+1] = equation.variables[order] / (order + 1)
    })
    // add constant
    integratedEquation.variables[0] = - evaluateEquation(integratedEquation, integratedEquation.start);
    return integratedEquation;
}

const memberLength = function(member, nodes){
    const nodeA = nodes[member.nodeA];
    const nodeB = nodes[member.nodeB];
    const distance = interNodalDistance(nodeA, nodeB);
    return ((distance.x) ** 2 + (distance.y) ** 2) ** 0.5;
}


const getOtherNode = function(nodes, member, nodeA){
    return member.nodeA === nodeA.id ? nodes[member.nodeB] : nodes[member.nodeA];
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
        console.log('node');
        console.log(node.id);

        Object.keys(supports).map(supportID => {
            const support = supports[supportID];
            if (node.id === support.node){
                console.log('support found')
                console.log(node.id);
                console.log(support.id);
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
            B = [...B, -force.xForce, -force.yForce]
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
            if (support.supportType === "fixed"){
                reactions.x = [0, 0, 0];
                reactions.y = [0, 0, 0];
                reactions.m = [0, 0, 0];
            } else if (support.supportType === "pinned"){
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
            if (support.supportType === "fixed"){
                reactions.x = [1, 0, 0];
                reactions.y = [0, 1, 0];
                reactions.m = [0, 0, 0]; 
            } else if (support.supportType === "pinned"){
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
            if (support.supportType === "fixed"){
                reactions.x = [0, 0, 0];
                reactions.y = [0, 0, 0];
                reactions.m = [0, 0, 0];
            } else if (support.supportType === "pinned"){
                reactions.x = [0, 0];
                reactions.y = [0, 0];
                reactions.m = [0, 0];
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
        if (line.slope / 2 * (end ** 2 - start ** 2) +
        line.intercept * (end - start) !== 0){
            return(
                (line.slope / 3 * (end ** 3 - start ** 3) +
                line.intercept/2 * (end ** 2 - start ** 2)) / 
                (line.slope / 2 * (end ** 2 - start ** 2) +
                line.intercept * (end - start))
            )
        } else {
            return (start+end) / 2;
        }
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