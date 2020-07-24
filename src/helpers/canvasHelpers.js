import { shortestLineDistance } from './geometry'

// draw line from clicked node to mouse position and handle member creation
const dragLine = function(event){
    let node = this.startNode;
    let nearestNode = checkCloseElements.bind({oldthis: this.oldthis, drawing: true})(event)
    const memberCreation = function(){
        this.oldthis.context.addMember({nodeA: {value: this.nodeA.id}, nodeB: {value: this.nodeB.id}})
        this.oldthis.canvas.current.removeEventListener("mouseup", this.oldthis.state.createMember)
    }
    drawNodes.bind(this.oldthis)({drawOnly: true})
    
    this.oldthis.setState(prevState => {
        this.oldthis.canvas.current.removeEventListener("mouseup", this.oldthis.state.createMember)
        return {
            createMember: memberCreation.bind({oldthis: this.oldthis, nodeA: node, nodeB: nearestNode})
        }
    }, ()=>{
        if (nearestNode !== null){
            drawSingleNode.bind(this.oldthis)(nearestNode, {color: 'green'})
            this.oldthis.canvas.current.addEventListener("mouseup", this.oldthis.state.createMember)
        }
    })

    // add listener if applicable
    drawSingleNode.bind(this.oldthis)(node, {color: 'green'});
    let mousePos = getMousePosition.bind(this.oldthis)(event);
    let canvas = this.oldthis.canvas.current;
    let ctx = canvas.getContext("2d")
    ctx.beginPath()
    ctx.moveTo(node.coordinates.x, node.coordinates.y)
    ctx.lineTo(mousePos.x, mousePos.y); 
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath()
}

// listens for mouse movement so that a line may be drawn to represent a 
export const drawLine = function(event) {
    let canvas = this.oldthis.canvas.current;
    // remove nearNodeListener
    canvas.removeEventListener("mousemove", this.oldthis.state.nearNodeListener);
    canvas.removeEventListener("mousemove", this.oldthis.state.checkLeaveNode);
    const boundDragLine = dragLine.bind({oldthis: this.oldthis, startNode: this.node});
    canvas.addEventListener("mousemove", boundDragLine);
    const mouseupListener = (event) => {
        let nearestNode = checkCloseElements.bind({oldthis: this.oldthis, drawing: true})(event)
        drawNodes.bind(this.oldthis)({drawOnly: true})
        canvas.removeEventListener("mousemove", boundDragLine);
        canvas.removeEventListener("mousedown", this.oldthis.state.drawLine);
        // add nearNodeListener back in
        checkCloseElements.bind({node: nearestNode, oldthis: this.oldthis})(event)
        canvas.addEventListener("mousemove", this.oldthis.state.nearNodeListener);
        canvas.removeEventListener("mouseup", mouseupListener);
    }
    canvas.addEventListener("mouseup", mouseupListener);
}

// get distance from a node to the mouse position
export const getDistance = (mousePos, node) => {
    const distance = ((mousePos.x-node.coordinates.x) ** 2 + (mousePos.y-node.coordinates.y) ** 2) ** 0.5
    return distance
}    // draw nodes in the canvas


// draws the entire canvas
export const drawNodes = function(options = {}){
    // get canvas coordinates
    let canvas = this.canvas['current'];
    const context = canvas.getContext("2d");
    let nodes = addNodeCoordinates.bind(this)(this.props.nodes)
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // draw supports
    console.log('this.props.solved')
    console.log(this.props.solved)
    if (!this.props.solved){
        Object.keys(this.props.supports).map(key => {
            let support = this.props.supports[key];
            drawSingleSupport.bind(this)(support)
        })
    } else {
        console.log('solved')
        console.log(this.props.supportReactions)
        Object.keys(this.props.supportReactions).map(key => {
            const reaction = this.props.supportReactions[key];
            drawSingleForce.bind(this)(reaction, {color: 'red'});
            if (reaction.moment){
                drawSingleMoment.bind(this)(reaction, {color: 'red'});
            }
        })
    }

    // draw members
    Object.keys(this.props.members).map(key => { 
        let member = this.props.members[key];
        drawSingleMember.bind(this)(member);
    })

    // draw nodes
    Object.keys(nodes).map(key => { 
        let node = nodes[key];
        drawSingleNode.bind(this)(node, {color: node.connectionType === 'pinned' ? 'white' : "blue"})
    }) 
    // draw forces 
    Object.keys(this.props.forces).map(key => {
        let force = this.props.forces[key];
        drawSingleForce.bind(this)(force)
    })

    Object.keys(this.props.moments).map(key => {
        const moment = this.props.moments[key];
        drawSingleMoment.bind(this)(moment)
    })

    
    if (options.drawOnly !== true){
        this.setState((prevState) =>  {
            this.canvas.current.removeEventListener("mousemove", prevState.nearNodeListener)
            return {nearNodeListener: checkCloseElements.bind(this)}
        }, () => {
            this.canvas.current.addEventListener("mousemove", this.state.nearNodeListener)
        })
        if (JSON.stringify(nodes) !== JSON.stringify(this.props.nodes)){
            this.context.addNodeCoordinates(nodes)
        }
    }
}

// draw a single node
export const drawSingleNode = function(node, options = {}){
    let canvas = this.canvas['current'];
    let ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.arc(node.coordinates.x, node.coordinates.y, 5, 0, 2 * Math.PI);
    ctx.stroke(); 
    if (node.connectionType === 'pinned'){
        ctx.fillStyle = options.color ? options.color : 'white';
    } else if (node.connectionType === 'fixed'){
        ctx.fillStyle = options.color ? options.color : 'blue';
    }
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = "16px Arial";
    ctx.fillText(node.id.toString(), node.coordinates.x + 15, node.coordinates.y - 10)
    ctx.closePath()
}


// draws a single member
export const drawSingleMember = function(member, options = {}){
    let canvas = this.canvas['current'];
    let ctx = canvas.getContext("2d");
    ctx.beginPath();
    let nodeA = {...this.props.nodes[member.nodeA]}
    let nodeB = {...this.props.nodes[member.nodeB]}
    ctx.moveTo(nodeA.coordinates.x, nodeA.coordinates.y)
    ctx.lineWidth = 2
    ctx.lineTo(nodeB.coordinates.x, nodeB.coordinates.y); 
    const width = nodeB.coordinates.x - nodeA.coordinates.x
    const height = nodeB.coordinates.y - nodeA.coordinates.y
    const textPos = {x: nodeA.coordinates.x + width / 2, y: height / 2 + nodeA.coordinates.y + 15}
    ctx.lineWidth = 2;
    ctx.strokeStyle = options.color === undefined ? "#777" : options.color
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.font = "16px Arial";
    ctx.fillText(member.id.toString(), textPos.x, textPos.y)
    ctx.closePath()
}

export const drawSingleForce = function(force, options = {}){
    let canvas = this.canvas['current'];
    let ctx = canvas.getContext("2d");
    ctx.beginPath();
    if (!force.forceType || force.forceType === "point"){
        let startEnd = getStartEnd.bind(this)(force)
        let textPos = forceText.bind(this)(force)
        // x-component
        if (Math.abs(force.xForce) > 1E-5){
            drawArrow(startEnd.xForce.start, 
                startEnd.xForce.end,
                ctx,
                {color: options.color ? options.color : '#444'})
            ctx.beginPath()
            ctx.fillStyle = options.color ? options.color : '#444';
            ctx.font = "16px Arial";
            ctx.textAlign = textPos.xForce.alignment; 
            ctx.fillText(force.xForce + ' kN', textPos.xForce.x, textPos.xForce.y) 
            ctx.closePath()
        }
        // y-component
        if (Math.abs(force.yForce) > 1E-5){
            drawArrow(startEnd.yForce.start, 
                startEnd.yForce.end,
                ctx,
                {color: options.color ? options.color : '#444'}) 
            ctx.beginPath()
            ctx.fillStyle = options.color ? options.color : '#444';
            ctx.font = "16px Arial";
            ctx.textAlign = textPos.yForce.alignment; 
            ctx.fillText(force.yForce + ' kN', textPos.yForce.x, textPos.yForce.y)              
            ctx.closePath()
        }
    } else if (force.forceType === "distributed"){
        drawDistributedLoad.bind(this)(force, ctx, {color: options.color ? options.color : "#444"})
        let textPos = forceText.bind(this)(force)
        ctx.beginPath()
        ctx.font = "16px Arial";
        ctx.fillStyle = options.color ? options.color : "#444"
        ctx.textAlign = textPos.startForce.alignment; 
        ctx.fillText('x: ' + force.xForceStart + ' kN', textPos.startForce.x, textPos.startForce.y-8)     
        ctx.fillText('y: ' + force.yForceStart + ' kN', textPos.startForce.x, textPos.startForce.y+8)    
        ctx.fillText('x: ' + force.xForceEnd + ' kN', textPos.endForce.x, textPos.endForce.y-8) 
        ctx.fillText('y: ' + force.yForceEnd + ' kN', textPos.endForce.x, textPos.endForce.y+8)
        ctx.closePath()
    }
}

export const drawSingleMoment = function(moment, options = {}){
    let canvas = this.canvas['current'];
    let ctx = canvas.getContext("2d");
    const point = getMomentLocation.bind(this)(moment)
    ctx.beginPath()
    ctx.lineWidth = 1;
    ctx.arc(point.x, point.y, 15, Math.PI / 2,  2 * Math.PI);
    ctx.strokeStyle = options.color ? options.color : "#444";
    ctx.stroke();
    ctx.closePath()
    ctx.beginPath()
    if (moment.moment < 0){
        ctx.moveTo(point.x, point.y + 15)
        ctx.lineTo(point.x, point.y + 18)
        ctx.lineTo(point.x+5, point.y + 15)
        ctx.lineTo(point.x, point.y + 12)
    } else {        
        ctx.moveTo(point.x + 15, point.y)
        ctx.lineTo(point.x+12, point.y)
        ctx.lineTo(point.x + 15, point.y + 5)
        ctx.lineTo(point.x+18, point.y)
    }

    ctx.strokeStyle = options.color ? options.color : "#444";
    ctx.font = "16px Arial";
    ctx.textAlign = 'center';
    let text = "M: "
    text = text + moment.moment + " kNm"
    const textPos = {
        x: point.x + 30,
        y: point.y + 30
    }
    ctx.fillStyle = options.color ? options.color : "#444";
    ctx.fillText(text, textPos.x, textPos.y);

    ctx.fill();
    ctx.closePath();
}

const getMomentLocation = function(moment){
    if (moment.node){
        const node = this.props.nodes[moment.node];
        return {
            x: node.coordinates.x,
            y: node.coordinates.y
        }
    } else if (moment.member){
        const member = this.props.members[moment.member]
        const nodeA = this.props.nodes[member.nodeA]
        const nodeB = this.props.nodes[member.nodeB]
        const width = nodeB.coordinates.x - nodeA.coordinates.x
        const height = nodeB.coordinates.y - nodeA.coordinates.y
        const slope = Math.abs(width) < 1E-5 ? null : height / width
        const location = slope !== null ? {
            x: moment.location / 100.00 * width + nodeA.coordinates.x,
            y: moment.location / 100.00 * width * slope + nodeA.coordinates.y,
        } : {
            x: nodeA.coordinates.x,
            y: moment.location / 100.00 * height + nodeA.coordinates.y,
        }
        return location;
    }
}


export const drawSingleSupport = function(support, options = {}){
    let canvas = this.canvas['current'];
    let ctx = canvas.getContext("2d");
    let node = this.props.nodes[support.node]
    let startPoint = {
        x: node.coordinates.x,
        y: node.coordinates.y
    }
    if (support.supportType === 'fixed'){
        drawBase(startPoint, ctx, 40, {options})
    } else if (support.supportType === 'pinned'){
        startPoint.x = node.coordinates.x
        startPoint.y = node.coordinates.y
        let drawOptions = {
            width: 20,
            baseLength: 40
        }
        // make equilateral triangle
        drawOptions.height = (drawOptions.width / 2) * Math.tan(Math.PI / 3)
        drawPinned(startPoint, ctx, drawOptions, options)
    } else if (support.supportType === 'xRoller'){
        let drawOptions = {
            width: 20,
            baseLength: 40
        }
        drawOptions.height = (drawOptions.width / 2) * Math.tan(Math.PI / 3)
        drawRoller(startPoint, ctx, drawOptions, {...options, vertical: true})        
    } else if (support.supportType ==='yRoller'){
        let drawOptions = {
            width: 20,
            baseLength: 40
        }
        drawOptions.height = (drawOptions.width / 2) * Math.tan(Math.PI / 3)
        drawRoller(startPoint, ctx, drawOptions, options)
    }
}
// draw base for supports
const drawBase = function(startPoint, ctx, baseLength, options){
    ctx.lineWidth = 1
    if (options.vertical){
        ctx.beginPath();
        let start = {...startPoint}
        start.y = start.y - baseLength / 2
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(start.x, start.y+baseLength)
        const numberOfLines = 6
        for (let i=0;i<numberOfLines;i++){
            ctx.moveTo(start.x, start.y+baseLength/numberOfLines * i)
            ctx.lineTo(start.x-10, start.y+baseLength/numberOfLines * i+8)
        }
        ctx.strokeStyle = options.color ? options.color : '#444444'
        ctx.stroke();
        ctx.closePath();
    } else {
        ctx.beginPath();
        let start = {...startPoint}
        start.x = start.x - baseLength / 2
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(start.x+baseLength, start.y)
        const numberOfLines = 6
        for (let i=0;i<numberOfLines;i++){
            ctx.moveTo(start.x+baseLength/numberOfLines * i, start.y)
            ctx.lineTo(start.x+baseLength/numberOfLines * i+8, start.y+10)
        }
        ctx.strokeStyle = options.color ? options.color : '#444444'
        ctx.stroke();
        ctx.closePath();
    }
}

const drawPinned = function(start, ctx, info = {}, options = {}){
    ctx.beginPath();
    ctx.lineWidth = 1
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(start.x-info.width / 2, start.y+info.height)
    ctx.lineTo(start.x+info.width/2, start.y+info.height)
    ctx.lineTo(start.x, start.y)
    ctx.strokeStyle = options.color ? options.color : '#444444'
    ctx.stroke();
    ctx.closePath()
    const basePos = {
        x: start.x,
        y: start.y+info.height
    }
    drawBase(basePos, ctx, info.baseLength, options);
}


const drawRoller = function(start, ctx, info = {}, options = {}){
    const width = info.width-6
    const height = info.height-6
    ctx.lineWidth = 1
    if (options.vertical){
        ctx.strokeStyle = options.color ? options.color : '#444444'
        let wheels = [
            {x: start.x - height - 3, y: start.y - width / 2},
            {x: start.x - height - 3, y: start.y},
            {x: start.x - height - 3, y: start.y  + width / 2},
        ]
        ctx.beginPath();
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(start.x-height, start.y - width / 2)
        ctx.lineTo(start.x-height, start.y + width /2)
        ctx.lineTo(start.x, start.y)
        ctx.stroke();
        ctx.closePath()
        wheels.map(point => {
            ctx.beginPath()
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
        })
        const basePos = {
            x: start.x-info.height,
            y: start.y
        }
        drawBase(basePos, ctx, info.baseLength, {...options, vertical: true});

    } else {
        ctx.strokeStyle = options.color ? options.color : '#444444'
        let wheels = [
            {x: start.x - width / 2, y: start.y + height + 3},
            {x: start.x, y: start.y + height + 3},
            {x: start.x + width / 2, y: start.y + height + 3},
        ]
        ctx.beginPath();
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(start.x-width / 2, start.y+height)
        ctx.lineTo(start.x+width /2, start.y+height)
        ctx.lineTo(start.x, start.y)
        ctx.stroke();
        ctx.closePath()
        wheels.map(point => {
            ctx.beginPath()
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
        })
        const basePos = {
            x: start.x,
            y: start.y+info.height
        }
        drawBase(basePos, ctx, info.baseLength, options);
    }
}


// check if mouse is inside hitbox
const supportBox = (support, node, mousePos) => {
    let coordinates = node.coordinates
    if (support.supportType === 'xRoller'){
        if (mousePos.y >= coordinates.y-20 && mousePos.y <= coordinates.y + 20
            && mousePos.x >= coordinates.x - 28 && mousePos.x <= coordinates.x){
                return true
        }
    } else {
        if (mousePos.y >= coordinates.y && mousePos.y <= coordinates.y + 28
            && mousePos.x >= coordinates.x - 20 && mousePos.x <= coordinates.x + 20){
                return true
        }        
    }
    return false
}

// get start and end to arrows in case of point loads
const getStartEnd = function(force){
    const lineLength = 35
    let startEnd = {
        xForce: {
            start: {
                x: null,
                y: null
            },
            end: {
                x: null,
                y: null
            }
        },
        yForce: {
            start: {
                x: null,
                y: null
            },
            end: {
                x: null,
                y: null
            }
        }
    }
    if (force.node){
        const node = this.props.nodes[force.node]

        startEnd.xForce.start = {x: node.coordinates.x, y: node.coordinates.y}
        startEnd.yForce.start = {x: node.coordinates.x, y: node.coordinates.y}
        // deal with x-component
        if (force.xForce > 0){
            startEnd.xForce.end = {x: node.coordinates.x + lineLength, y: node.coordinates.y}
        } else {
            startEnd.xForce.end = {x: node.coordinates.x - lineLength, y: node.coordinates.y}
        }
        // deal with y-component
        if (force.yForce > 0){
            startEnd.yForce.end = {x: node.coordinates.x, y: node.coordinates.y - lineLength}
        } else {
            startEnd.yForce.end = {x: node.coordinates.x, y: node.coordinates.y + lineLength}
        }
    } else if (force.member && force.forceType === 'point') {
        const member = this.props.members[force.member]
        const nodeA = this.props.nodes[member.nodeA]
        const nodeB = this.props.nodes[member.nodeB]
        const width = nodeB.coordinates.x - nodeA.coordinates.x
        const height = nodeB.coordinates.y - nodeA.coordinates.y
        const slope = Math.abs(width) < 1E-5 ? null : height / width
        startEnd.xForce.start = slope !== null ? {
            x: force.location / 100.00 * width + nodeA.coordinates.x,
            y: force.location / 100.00 * width * slope + nodeA.coordinates.y,
        } : {
            x: nodeA.coordinates.x,
            y: force.location / 100.00 * height + nodeA.coordinates.y,
        }
        startEnd.yForce.start = slope !== null ? {
            x: force.location / 100.00 * width + nodeA.coordinates.x,
            y: force.location / 100.00 * width * slope + nodeA.coordinates.y,
        } : {
            x: nodeA.coordinates.x,
            y: force.location / 100.00 * height + nodeA.coordinates.y,
        }

        // deal with x-component
        if (force.xForce > 0){
            startEnd.xForce.end = {x: startEnd.xForce.start.x + lineLength, y: startEnd.xForce.start.y}
        } else {
            startEnd.xForce.end = {x: startEnd.xForce.start.x - lineLength, y: startEnd.xForce.start.y}
        }
        // deal with y-component
        if (force.yForce > 0){
            startEnd.yForce.end = {x: startEnd.yForce.start.x, y: startEnd.yForce.start.y - lineLength}
        } else {
            startEnd.yForce.end = {x: startEnd.yForce.start.x, y: startEnd.yForce.start.y + lineLength}
        }
    }
    return startEnd
}

export const drawArrow = function(pointA, pointB, ctx, options = {}){
    let arrow = []
    // vertical
    ctx.lineWidth = 1
    if (Math.abs(pointA.x - pointB.x) < 1E-5){
        if (pointB.y - pointA.y > 0){
            arrow.push({x: pointA.x, y: pointA.y})
            arrow.push({x: pointB.x, y: pointB.y})
            arrow.push({x: pointB.x - 4, y: pointB.y - 10})
            arrow.push({x: pointB.x + 4, y: pointB.y - 10})
            arrow.push({x: pointB.x, y: pointB.y})
        } else {
            arrow.push({x: pointA.x, y: pointA.y})
            arrow.push({x: pointB.x, y: pointB.y})
            arrow.push({x: pointB.x - 4, y: pointB.y + 10})
            arrow.push({x: pointB.x + 4, y: pointB.y + 10})
            arrow.push({x: pointB.x, y: pointB.y})
        }
    // horizontal
    } else {
        if (pointB.x - pointA.x > 0){
            arrow.push({x: pointA.x, y: pointA.y})
            arrow.push({x: pointB.x, y: pointB.y})
            arrow.push({x: pointB.x - 10, y: pointB.y - 4})
            arrow.push({x: pointB.x - 10, y: pointB.y + 4})
            arrow.push({x: pointB.x, y: pointB.y})
        } else {
            arrow.push({x: pointA.x, y: pointA.y})
            arrow.push({x: pointB.x, y: pointB.y})
            arrow.push({x: pointB.x + 10, y: pointB.y - 4})
            arrow.push({x: pointB.x + 10, y: pointB.y + 4})
            arrow.push({x: pointB.x, y: pointB.y})
        }
    }
    ctx.beginPath()
    ctx.moveTo(arrow[0].x, arrow[0].y)
    ctx.lineTo(arrow[1].x, arrow[1].y)
    ctx.lineTo(arrow[2].x, arrow[2].y)
    ctx.lineTo(arrow[3].x, arrow[3].y)
    ctx.lineTo(arrow[4].x, arrow[4].y)
    ctx.lineWidth = 2;
    ctx.strokeStyle = options.color ? options.color : "#444"
    ctx.stroke()
    ctx.fillStyle = options.color ? options.color : "#444"
    ctx.fill()
    ctx.closePath()
}

const forceText = function(force){
    if (force.forceType === 'distributed'){
        const bottom = bottomLine.bind(this)(force)
        const top = topLine.bind(this)(force)
        let textPos = {
            startForce: {
                x: null,
                y: null,
                alignment: null
            },
            endForce: {
                x: null,
                y: null,
                alignment: null
            }
        }

        // if line is vertical
        if (Math.abs(bottom.pointA.x - bottom.pointB.x) < 1E-5){
            textPos.startForce.x = top.pointA.x - 15
            textPos.startForce.y = top.pointA.y
            textPos.startForce.alignment = 'right'
            textPos.endForce.x = top.pointB.x - 15
            textPos.endForce.y = top.pointB.y
            textPos.endForce.alignment = 'right'
        // if line is horizontal
        } else {
            textPos.startForce.x = top.pointA.x
            textPos.startForce.y = top.pointA.y - 30
            textPos.startForce.alignment = 'center'
            textPos.endForce.x = top.pointB.x
            textPos.endForce.y = top.pointB.y - 30
            textPos.endForce.alignment = 'center'
        }
        return textPos
    } else {
        const startEnd = getStartEnd.bind(this)(force)
        let text = {
            xForce: {
                x: null,
                y: null,
                alignment: null
            },
            yForce: {
                x: null,
                y: null,
                alignment: null
            }
        }
        // deal with x-component
        if (force.xForce > 0){
            text.xForce.x = startEnd.xForce.end.x + 15
            text.xForce.y = startEnd.xForce.end.y + 6
            text.xForce.alignment = "left"; 
        } else {
            text.xForce.alignment = "right"; 
            text.xForce.x = startEnd.xForce.end.x - 15
            text.xForce.y = startEnd.xForce.end.y + 6
        }
        // deal with y-component
        if (force.yForce > 0){
            text.yForce.textAlign = "center"; 
            text.yForce.x = startEnd.yForce.end.x
            text.yForce.y = startEnd.yForce.end.y -15
        } else {
            text.yForce.alignment = "center"; 
            text.yForce.x = startEnd.yForce.end.x
            text.yForce.y = startEnd.yForce.end.y + 15
        }
        return text
    }

}

export const topLine = function(force){
    const member = this.props.members[force.member]
    const nodeA = this.props.nodes[member.nodeA]
    const nodeB = this.props.nodes[member.nodeB]
    const bottom = bottomLine.bind(this)(force)
    // if not vertical
    if (Math.abs(nodeA.coordinates.x - nodeB.coordinates.x) > 1E-5){
        // both start and end are similar
        if (Math.abs(force.yForceStart - force.yForceEnd) < 1E-5){
            return {
                pointA: {
                    x: bottom.pointA.x,
                    y: bottom.pointA.y-35
                },
                pointB: {
                    x: bottom.pointB.x,
                    y: bottom.pointB.y-35
                }
            }
        // start is greater
        } else if (force.yForceStart > force.yForceEnd){
            return({
                pointA: {
                    x: bottom.pointA.x,
                    y: bottom.pointA.y-35
                },
                pointB: {
                    x: bottom.pointB.x,
                    y: bottom.pointB.y- 35 * (force.yForceEnd / force.yForceStart)
                }})
        // end is greater
        } else if (force.yForceStart < force.yForceEnd){
            return({
                pointA: {
                    x: bottom.pointA.x,
                    y: bottom.pointA.y - 35 * (force.yForceStart / force.yForceEnd)
                },
                pointB: {
                    x: bottom.pointB.x,
                    y: bottom.pointB.y-35 
                }})
        }
    } else {
        // both start and end are similar
        if (Math.abs(force.xForceStart - force.xForceEnd) < 1E-5){
            return {
                pointA: {
                    x: bottom.pointA.x-35,
                    y: bottom.pointA.y
                },
                pointB: {
                    x: bottom.pointB.x-35,
                    y: bottom.pointB.y
                }
            }
        // start is greater
        } else if (force.xForceStart > force.xForceEnd){
            return({
                pointA: {
                    x: bottom.pointA.x-35,
                    y: bottom.pointA.y
                },
                pointB: {
                    x: bottom.pointB.x - 35 * (force.xForceEnd / force.xForceStart),
                    y: bottom.pointB.y
                }})
        // end is greater
        } else if (force.xForceStart < force.xForceEnd){
            return({
                pointA: {
                    x: bottom.pointA.x - 35 * (force.xForceStart / force.xForceEnd),
                    y: bottom.pointA.y
                },
                pointB: {
                    x: bottom.pointB.x-35,
                    y: bottom.pointB.y 
                }})
        }

    }
}

export const bottomLine = function(force){
    const member = this.props.members[force.member]
    const nodeA = this.props.nodes[member.nodeA]
    const nodeB = this.props.nodes[member.nodeB]
    const width = nodeB.coordinates.x - nodeA.coordinates.x
    const height = nodeB.coordinates.y - nodeA.coordinates.y
    // if not vertical
    if (Math.abs(nodeA.coordinates.x - nodeB.coordinates.x) > 1E-5){
        return (
            {
                pointA: {
                    x: nodeA.coordinates.x + force.startPoint / 100 * width,
                    y: Math.min(nodeA.coordinates.y, nodeB.coordinates.y) - 15
                },
                pointB: {
                    x: nodeB.coordinates.x - Math.abs(force.endPoint - 100) / 100 * width,
                    y: Math.min(nodeA.coordinates.y, nodeB.coordinates.y) - 15
                }
            }
        )
    } else {
        return (
            {
                pointA: {
                    x: nodeA.coordinates.x - 15,
                    y: nodeA.coordinates.y + force.startPoint / 100 * height
                },
                pointB: {
                    x: nodeB.coordinates.x - 15,
                    y: nodeB.coordinates.y - Math.abs(force.endPoint - 100) / 100 * height
                }
            }
        )
    }
}

export const drawDistributedLoad = function(force, ctx, options = {}){
    const numPoints = 5;

    // as much as posible, draw the forces vertically
    let bottom = bottomLine.bind(this)(force)
    let top = topLine.bind(this)(force)

    bottom = drawSegments(bottom.pointA,
        bottom.pointB, 
        numPoints, 
        ctx,
        {color: options.color ? options.color : "#444"})
    top = drawSegments(top.pointA,
        top.pointB, 
        numPoints, 
        ctx,
        {color: options.color ? options.color : "#444"})
    // correctly shows arrows
    if (force.yForceStart > 0) {
        Object.keys(top).map(key => {
            if (((bottom[key].x - top[key].x) ** 2 + (bottom[key].y - top[key].y) ** 2) ** 0.5 > 10){
                drawArrow(bottom[key], top[key], ctx, {color: options.color ? options.color : "#444"})                
            }
        })
    } else {
        Object.keys(top).map(key => {
            if (((bottom[key].x - top[key].x) ** 2 + (bottom[key].y - top[key].y) ** 2) ** 0.5 > 10){
                drawArrow(top[key], bottom[key], ctx, {color: options.color ? options.color : "#444"})                
            }
        })
    }

}


// draws a line and returns the points that make it up
const drawSegments = function(pointA, pointB, numPoints, ctx, options = {}){
    let linePoints = []
    ctx.moveTo(pointA.x, pointA.y)
    ctx.lineWidth = 1
    ctx.lineTo(pointB.x, pointB.y)
    const height = pointB.y - pointA.y;
    const width = pointB.x - pointA.x;
    const slope = Math.abs(width) < 1E-5 ? null : height / width
    if (slope !== null){
        const segmentLength = width / numPoints;
        for ( let i = 0 ; i < numPoints; i++){
            const x = i * segmentLength + pointA.x
            const y = (i * segmentLength) * slope + pointA.y
            linePoints.push({x: x, y: y})
        }
        linePoints.push({x: pointB.x, y:pointB.y})
    } else {
        const segmentLength = height / numPoints;
        for ( let i = 0 ; i < numPoints; i++){
            const x = pointA.x
            const y = i * segmentLength + pointA.y
            linePoints.push({x: x, y: y})
        }
        linePoints.push({x: pointB.x, y:pointB.y})
    }
    ctx.strokeStyle = options.color ? options.color : "#444";
    ctx.stroke()
    return linePoints
}

const memberLength = function(member, nodes){
    const nodeA = nodes[member.nodeA]
    const nodeB = nodes[member.nodeB]
    return (nodeB.coordinates.x - nodeA.coordinates.x)
}

const memberHeight = function(member, nodes){
    const nodeA = nodes[member.nodeA]
    const nodeB = nodes[member.nodeB]
    return (nodeB.coordinates.x - nodeA.coordinates.x)
}

// check if the cursor has been pulled away from the node
export const checkLeaveNode = function(event){
    let mousePos = getMousePosition.bind(this.oldthis)(event);
    let canvas = this.oldthis.canvas.current;
    const distance = this.force ? 35 : 7
    if (this.node !== undefined){
        if (getDistance(mousePos, this.node) >= distance) {
            drawNodes.bind(this.oldthis)()
            canvas.removeEventListener("mousemove", this.oldthis.state.checkLeaveNode);
            canvas.removeEventListener("mousedown", this.oldthis.state.drawLine);
            canvas.removeEventListener("mousedown", this.oldthis.state.setFocus);
        }
    } else {
        if (this.line !== true){
            if (shortestLineDistance(mousePos, this.member) >= distance) {
                drawNodes.bind(this.oldthis)()
                canvas.removeEventListener("mousemove", this.oldthis.state.checkLeaveLine);
                canvas.removeEventListener("mousedown", this.oldthis.state.setFocus);
            }
        }
    }
    
}


// check if the cursor has been pulled away from the support
export const checkLeaveSupport = function(event){
    let mousePos = getMousePosition.bind(this.oldthis)(event);
    let support = this.support
    let node = this.node;
    let canvas = this.oldthis.canvas.current;
    if (!supportBox(support, node, mousePos)){
        drawNodes.bind(this.oldthis)()
        canvas.removeEventListener("mousemove", this.oldthis.state.checkLeaveSupport);
        canvas.removeEventListener("mousedown", this.oldthis.state.setFocus);
    }    
}


// get array with the extrema of the points
export const getExtrema = (nodes) => {

    let xMin = null
    let xMax = null
    let yMin = null
    let yMax = null

    Object.keys(nodes).map(key => {
        const node = nodes[key]
        if (key == Object.keys(nodes)[0]) {
            xMin = node.x;
            xMax = node.x;
            yMin = node.y;
            yMax = node.y;
        }
        if (xMin > node.x) { xMin = node.x }
        if (xMax < node.x) { xMax = node.x }
        if (yMin > node.y) { yMin = node.y}
        if (yMax < node.y) { yMax = node.y }
    })

    return {
        xMin: xMin,
        xMax: xMax,
        yMin: yMin,
        yMax: yMax,
    }
}

// get the positions in the canvas from the given 'raw' data so that it can all fit in the canvas
export const computePositions = function(node, extrema){
    const width = (extrema.xMax - extrema.xMin);
    const height = (extrema.yMax - extrema.yMin);
    let newX = parseInt((node.x - extrema.xMin) / width * this.state.width);
    let newY = parseInt((node.y - extrema.yMin) / height * this.state.height);
    if (height === 0){
        newY = this.state.height / 2.0;
    }
    if (width === 0){
        newX = this.state.width / 2.0;
    }
    return {
        x: newX * 0.7 + this.state.width * 0.15,
        y: ((this.state.height - newY) * 0.7) + this.state.height * 0.15
    }
}



// add coordinates to node w.r.t. canvas
export const addNodeCoordinates = function(nodes){
    let extrema = getExtrema(nodes);
    let newNodes = {}
    
    Object.keys(this.props.nodes).map(key => { 
        let node = this.props.nodes[key];
        const newPos = computePositions.bind(this)(node, extrema);
        newNodes[key] = {...node}
        newNodes[key].coordinates = {
            x: newPos.x,
            y: newPos.y
        }
    })
    return newNodes
}


// checks for near nodes and lines and can also return them
export const checkCloseElements = function(event){
    // when this is bound to the drawing function
    if (this.drawing === true){
        let mousePos = getMousePosition.bind(this.oldthis)(event);
        let canvas = this.oldthis.canvas.current;
        let currentNode = this.currentNode;
        let nearestNode = null;
        Object.keys(this.oldthis.props.nodes).map(key => {
            const node = this.oldthis.props.nodes[key]
            if (getDistance(mousePos, node) < 7){
                nearestNode = {...node};
            }
        })
        return nearestNode;

    // when passed a node to simulate being near it

    } else if (this.node !== undefined && this.node !== null) {
        let node = this.node
        let canvas = this.oldthis.canvas.current;
        this.oldthis.setState((prevState) => {
            canvas.removeEventListener("mousedown", prevState.drawLine)
            canvas.removeEventListener("mousemove", prevState.checkLeaveNode);
            return{
                checkLeaveNode: checkLeaveNode.bind({oldthis: this.oldthis, node: node}),
                drawLine: drawLine.bind({oldthis: this.oldthis, node: node})
            }
        }, () => {
            canvas.addEventListener("mousedown", this.oldthis.state.drawLine)
            canvas.addEventListener("mousemove", this.oldthis.state.checkLeaveNode);
        })

    // this part acts as a listener when nothing else is happening

    } else if (this.state !== undefined) {
        let mousePos = getMousePosition.bind(this)(event);
        let canvas = this.canvas.current;
        let foundNode = false;
        let foundMember = false;
        let foundSupport = false;
        let foundForce = false;
        let foundMoment = false;
        Object.keys(this.props.nodes).map(key => {
            const node = this.props.nodes[key]
            if (getDistance(mousePos, node) < 7){
                drawNodes.bind(this)()
                drawSingleNode.bind(this)(node, {color: "red"});
                this.setState((prevState) => {
                    canvas.removeEventListener("mousedown", prevState.drawLine)
                    canvas.removeEventListener("mousemove",  this.state.checkLeaveNode)
                    canvas.removeEventListener("mousemove",  this.state.checkLeaveLine)
                    canvas.removeEventListener("mousemove",  this.state.checkLeaveSupport)
                    canvas.removeEventListener("mousedown", this.state.setFocus)
                    return{
                        setFocus: setFocusItem.bind({oldthis: this, item: node, itemType: 'node', canvas: canvas}),
                        checkLeaveNode: checkLeaveNode.bind({oldthis: this, node: node}),
                        drawLine: drawLine.bind({oldthis: this, node: node})
                    }
                }, () => {
                    canvas.addEventListener("mousedown", this.state.drawLine)
                    canvas.addEventListener("mousemove", this.state.checkLeaveNode);
                    canvas.addEventListener("mousedown", this.state.setFocus)
                    foundNode = true
                })
            }
        })
        if (!foundNode) {
            Object.keys(this.props.supports).map(key =>{
                const support = this.props.supports[key]
                const node = this.props.nodes[support.node]
                if (supportBox(support, node, mousePos)){
                    drawNodes.bind(this)()
                    drawSingleSupport.bind(this)(support, {color: 'blue'})
                    foundSupport = true;
                    this.setState((prevState) => {
                        canvas.removeEventListener("mousedown", prevState.drawLine)
                        canvas.removeEventListener("mousemove",  this.state.checkLeaveNode)
                        canvas.removeEventListener("mousemove",  this.state.checkLeaveLine)
                        canvas.removeEventListener("mousemove",  this.state.checkLeaveSupport)
                        canvas.removeEventListener("mousedown", this.state.setFocus)
                        return{
                            setFocus: setFocusItem.bind({oldthis: this, item: support, itemType: 'support', canvas: canvas}),
                            checkLeaveSupport: checkLeaveSupport.bind({oldthis: this, support: support, node: this.props.nodes[support.node]})
                        }
                    }, () => {
                        canvas.addEventListener("mousemove", this.state.checkLeaveSupport);
                        canvas.addEventListener("mousedown", this.state.setFocus)
                    })
                }
            })
        }
        if (!foundNode && !foundSupport) {
            Object.keys(this.props.forces).map(key =>{
                const force = this.props.forces[key]
                const textLocations = forceText.bind(this)(force)
                let pointA = {}
                let pointB = {}
                pointA = {
                    coordinates: {
                        x: force.forceType === "distributed" ? textLocations.startForce.x :  textLocations.xForce.x,
                        y: force.forceType === "distributed" ? textLocations.startForce.y :  textLocations.xForce.y
                    }
                }
                pointB = {
                    coordinates: {
                        x: force.forceType === "distributed" ? textLocations.endForce.x :  textLocations.yForce.x,
                        y: force.forceType === "distributed" ? textLocations.endForce.y :  textLocations.yForce.y
                    }
                }
                if (getDistance(mousePos, pointA) < 35 || getDistance(mousePos, pointB) < 35){
                    foundForce = true
                    let currentPoint = getDistance(mousePos, pointA) <= getDistance(mousePos, pointB) ? pointA : pointB
                    drawNodes.bind(this)()
                    drawSingleForce.bind(this)(force, {color: 'blue'})
                    this.setState((prevState) => {
                        canvas.removeEventListener("mousedown", prevState.drawLine)
                        canvas.removeEventListener("mousemove",  this.state.checkLeaveNode)
                        canvas.removeEventListener("mousemove",  this.state.checkLeaveLine)
                        canvas.removeEventListener("mousemove",  this.state.checkLeaveSupport)
                        canvas.removeEventListener("mousedown", this.state.setFocus)
                        return{
                            setFocus: setFocusItem.bind({oldthis: this, item: force, itemType: 'force', canvas: canvas}),
                            checkLeaveNode: checkLeaveNode.bind({oldthis: this, node: currentPoint, force: true})
                        }
                    }, () => {
                        canvas.addEventListener("mousemove", this.state.checkLeaveNode);
                        canvas.addEventListener("mousedown", this.state.setFocus)
                    })
                }
            })
        }
        if (!foundNode && !foundForce && !foundSupport) {
            Object.keys(this.props.moments).map(key =>{
                const moment = this.props.moments[key]
                const point = getMomentLocation.bind(this)(moment)
                const textPos = {
                    coordinates: {
                        x: point.x + 30,
                        y: point.y + 30
                    }
                }
                if (getDistance(mousePos, textPos) < 35){
                    foundMoment = true
                    drawNodes.bind(this)()
                    drawSingleMoment.bind(this)(moment, {color: 'blue'})
                    this.setState((prevState) => {
                        canvas.removeEventListener("mousedown", prevState.drawLine)
                        canvas.removeEventListener("mousemove",  this.state.checkLeaveNode)
                        canvas.removeEventListener("mousemove",  this.state.checkLeaveLine)
                        canvas.removeEventListener("mousemove",  this.state.checkLeaveSupport)
                        canvas.removeEventListener("mousedown", this.state.setFocus)
                        return{
                            setFocus: setFocusItem.bind({oldthis: this, item: moment, itemType: 'moment', canvas: canvas}),
                            checkLeaveNode: checkLeaveNode.bind({oldthis: this, node: textPos, force: true})
                        }
                    }, () => {
                        canvas.addEventListener("mousemove", this.state.checkLeaveNode);
                        canvas.addEventListener("mousedown", this.state.setFocus)
                    })
                }
            })
        }
        if (!foundNode && !foundForce && !foundSupport && !foundMoment) {
            Object.keys(this.props.members).map(key =>{
                const member = this.props.members[key]
                if (shortestLineDistance(mousePos, member) < 5){
                    foundMember = true
                    drawNodes.bind(this)()
                    drawSingleMember.bind(this)(member, {color: '#111111'})
                    this.setState(prevState => {
                        canvas.removeEventListener("mousemove",  this.state.checkLeaveNode)
                        canvas.removeEventListener("mousemove",  this.state.checkLeaveLine)
                        canvas.removeEventListener("mousemove",  this.state.checkLeaveSupport)
                        canvas.removeEventListener("mousedown", this.state.setFocus)
                        canvas.removeEventListener("mousedown", prevState.drawLine)
                        return({
                            setFocus: setFocusItem.bind({oldthis: this, item: member, itemType: 'member', canvas: canvas}),
                            checkLeaveLine: checkLeaveNode.bind({oldthis: this, member: member})
                        })
                    }, () => {
                        canvas.addEventListener("mousemove", this.state.checkLeaveLine)
                        canvas.addEventListener("mousedown", this.state.setFocus)
                    })    
                }
            })
        }
        if (!foundMember && !foundNode && !foundForce && !foundSupport && !foundMoment) {
            this.setState(prevState => {
                canvas.removeEventListener("mousedown", this.state.setFocus)
                return{
                    setFocus: setFocusItem.bind({oldthis: this, item: null, itemType: null, canvas: canvas})
                }
            }, () => {
                canvas.addEventListener("mousedown", this.state.setFocus)
            })
        }
        return null

    }
}


// runs when an element in the canvas is selected to inform the layout of this
const setFocusItem = function(){
    const item = this.item
    const itemType = this.itemType
    this.oldthis.context.setFocusItem(item, itemType)
    this.canvas.removeEventListener("mousedown", this.oldthis.state.setFocus)
}


// get mouse position relative to canvas
const getMousePosition = function(event){
    let style = window.getComputedStyle(this.canvas.current.parentElement);
    let xPadding = parseFloat(style.paddingLeft)
    let yPadding = parseFloat(style.paddingTop)
    return {x: event.clientX-xPadding, y: event.clientY-yPadding}
}