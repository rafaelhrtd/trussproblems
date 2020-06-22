export const shortestLineDistance = (pos, member) => {
    const vector = memberToVector(member);
    const unitNVector = nVector(vector);
    const originToPos = {
        x: pos.x - vector.origin.x,
        y: pos.y - vector.origin.y
    }
    const distanceToLine = dot(unitNVector, originToPos)
    const distanceVector = scalar(distanceToLine, unitNVector)
    const closestPoint = {
        x: originToPos.x - distanceVector.x,
        y: originToPos.y - distanceVector.y
    }
    const aToC = {
        x: closestPoint.x,
        y: closestPoint.y
    }
    const bToC = {
        x: closestPoint.x - vector.x,
        y: closestPoint.y - vector.y
    }
    const aToPos = {
        x: originToPos.x,
        y: originToPos.y
    }
    const bToPos = {
        x: originToPos.x - vector.x,
        y: originToPos.y - vector.y
    }

    const nodeToPosDistance = length(aToPos) <= length(bToPos) ? length(aToPos) : length(bToPos)

    // check if closest point falls outside of vector
    if (length(aToC) > length(vector) || length(bToC) > length(vector)){
        return Math.abs(nodeToPosDistance)
    } else {
        return Math.abs(distanceToLine)
    }
}

// dot product
export const dot = (a, b) => {
    return (a.x * b.x + a.y * b.y)
}
// scalar multiplication
export const scalar = (scalar, vector) => {
    return ({
        x: vector.x * scalar,
        y: vector.y * scalar
    })
}
// calculates the length of a vector
export const length = (vector) => {
    return ((vector.x) ** 2 + (vector.y) ** 2) ** 0.5
}

// make a 2d vector out of two points
export const vector = (a, b) => {
    return {x: b.x-a.x, y: b.y-a.y}
}

// unit vector
export const unit = (vector) => {
    const magnitude = length(vector);
    return({x: vector.x / magnitude, y: vector.y / magnitude})
}

// normal unit vector
export const nVector = (vector) => {
    let nVector = {}
    nVector.y = null
    nVector.x = null 
    if (vector.y !== 0 && vector.x !== 0){
        nVector.y = 1
        nVector.x = -(vector.y) / vector.x
    } else if (vector.x === 0){
        nVector.y = 0;
        nVector.x = 1;
    } else {
        nVector.y = 1;
        nVector.x = 0;
    }
    const mag = length(nVector)
    return ({x: nVector.x / mag, y: nVector.y / mag})
}

export const memberToVector = (member) => {
    // left goes first unless it is the same as the right, in which case bottom goes first
    const leftMost = member.nodes().a.coordinates.x <= member.nodes().b.coordinates.x ? member.nodes().a : member.nodes().b
    const rightMost = member.nodes().a.coordinates.x >= member.nodes().b.coordinates.x ? member.nodes().a : member.nodes().b
    const top = member.nodes().a.coordinates.y <= member.nodes().b.coordinates.y ? member.nodes().a : member.nodes().b
    const bottom = member.nodes().a.coordinates.y >= member.nodes().b.coordinates.y ? member.nodes().a : member.nodes().b
    if (leftMost !== rightMost){
        return {
            x: (rightMost.coordinates.x - leftMost.coordinates.x), 
            y: (rightMost.coordinates.y - leftMost.coordinates.y),
            origin: {
                x: leftMost.coordinates.x,
                y: leftMost.coordinates.y
            }}
    } else {
        return {
            x: (top.coordinates.x - bottom.coordinates.x), 
            y: (top.coordinates.y - bottom.coordinates.y),
            origin: {
                x: bottom.coordinates.x,
                y: bottom.coordinates.y
            }}
    }
}