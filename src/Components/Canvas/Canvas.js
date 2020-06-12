import React, { Component } from 'react';
import classes from './Canvas.css';
import Aux from '../../hoc/Aux/Aux';
import allContext from '../../context/allContext'

class Canvas extends Component {
    constructor(props) {
        super(props);
        this.canvas = React.createRef();
    }
    state = {
        height: window.innerHeight,
        width: window.innerWidth
    }

    static contextType = allContext;

    // get array with the extrema of the points
    getExtrema = (nodes) => {
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

    computePositions = (node, extrema) => {
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
            x: newX * 0.8 + this.state.width * 0.1,
            y: ((this.state.height - newY) * 0.8) + this.state.height * 0.1
        }
    }

    // add coordinates to node w.r.t. canvas
    addNodeCoordinates = (nodes) => {
        let extrema = this.getExtrema(nodes);
        let newNodes = {}
        
        Object.keys(this.props.nodes).map(key => { 
            let node = this.props.nodes[key];
            const newPos = this.computePositions(node, extrema);
            newNodes[key] = {...node}
            newNodes[key].coordinates = {
                x: newPos.x,
                y: newPos.y
            }
        })
        return newNodes
    }

    // draw nodes in the canvas
    drawNodes = (nodes, options = {}) => {
        // get canvas coordinates
        nodes = this.addNodeCoordinates(nodes)
        let canvas = this.canvas['current'];
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        let extrema = this.getExtrema(this.props.nodes);
        
        // draw members
        Object.keys(this.props.members).map(key => { 
            let member = this.props.members[key];
            this.drawSingleMember(member);
        }) 

        // draw nodes
        Object.keys(nodes).map(key => { 
            let node = nodes[key];
            this.drawSingleNode(node, {color: "blue"})
        }) 
        
        if (options.drawOnly !== true){
            this.setState((prevState) =>  {
                this.canvas.current.removeEventListener("mousemove", prevState.nearNodeListener)
                return {nearNodeListener: this.checkNearNodes.bind(this)}
            }, () => {
                this.canvas.current.addEventListener("mousemove", this.state.nearNodeListener)
            })
    
            this.context.addNodeCoordinates(nodes)
        }
    }

    handleResize = () => {
        let style = window.getComputedStyle(this.canvas.current.parentElement);
        let xPadding = parseFloat(style.paddingLeft)
        let yPadding = parseFloat(style.paddingTop)
        let height = this.canvas.current.parentElement.clientHeight - yPadding
        let width = this.canvas.current.parentElement.clientWidth - xPadding
        this.setState({
            height: height,
            width: width
        });
    }
    componentDidMount = () => {
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
    }

    drawSingleNode = (node, options) => {
        let canvas = this.canvas['current'];
        let ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(node.coordinates.x, node.coordinates.y, 5, 0, 2 * Math.PI);
        ctx.stroke(); 
        ctx.fillStyle = options.color;
        ctx.fill();
    }

    drawSingleMember = (member, options) => {
        let canvas = this.canvas['current'];
        let ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.moveTo(this.props.nodes[member.nodeA].coordinates.x, this.props.nodes[member.nodeA].coordinates.y)
        ctx.lineTo(this.props.nodes[member.nodeB].coordinates.x, this.props.nodes[member.nodeB].coordinates.y); 
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    componentWillUmount = () => {
        window.removeEventListener('resize', this.handleResize);      
    }
    // get mouse position relative to canvas
    getMousePosition = (event) => {
        let style = window.getComputedStyle(this.canvas.current.parentElement);
        let xPadding = parseFloat(style.paddingLeft)
        let yPadding = parseFloat(style.paddingTop)
        return {x: event.clientX-xPadding, y: event.clientY-yPadding}
    }

    // check if the cursor has been pulled away from the node
    checkLeaveNode = function(event, node = null){
        let mousePos = this.oldthis.getMousePosition(event);
        let canvas = this.oldthis.canvas.current;
        if (this.oldthis.getDistance(mousePos, this.node) >= 7) {
            this.oldthis.drawSingleNode(this.node, {color: 'blue'});
            canvas.removeEventListener("mousemove", this.oldthis.state.checkLeaveNode);
            canvas.removeEventListener("mousedown", this.oldthis.state.drawLine);
        }
        
    }

    // draw line from clicked node to mouse position and handle member creation
    dragLine = function(event){
        let node = this.startNode;
        let nearestNode = this.oldthis.checkNearNodes.bind({oldthis: this.oldthis, drawing: true})(event)
        const memberCreation = function(){
            this.oldthis.context.addMember(this.nodeA, this.nodeB)
            this.oldthis.canvas.current.removeEventListener("mouseup", this.oldthis.state.createMember)
        }
        this.oldthis.drawNodes(this.oldthis.props.nodes, {drawOnly: true})

        // the cleanup is not working. Need to use state to ensure it works
        this.oldthis.setState(prevState => {
            this.oldthis.canvas.current.removeEventListener("mouseup", this.oldthis.state.createMember)
            return {
                createMember: memberCreation.bind({oldthis: this.oldthis, nodeA: node, nodeB: nearestNode})
            }
        }, ()=>{
            if (nearestNode !== null){
                this.oldthis.drawSingleNode(nearestNode, {color: 'green'})
                this.oldthis.canvas.current.addEventListener("mouseup", this.oldthis.state.createMember)
            }
        })

        // add listener if applicable
        this.oldthis.drawSingleNode(node, {color: 'green'})
        let mousePos = this.oldthis.getMousePosition(event);
        let canvas = this.oldthis.canvas.current;
        let ctx = canvas.getContext("2d")
        ctx.beginPath()
        ctx.moveTo(node.coordinates.x, node.coordinates.y)
        ctx.lineTo(mousePos.x, mousePos.y); 
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // 
    drawLine = function(event) {
        let canvas = this.oldthis.canvas.current;
        // remove nearNodeListener
        canvas.removeEventListener("mousemove", this.oldthis.state.nearNodeListener);
        canvas.removeEventListener("mousemove", this.oldthis.state.checkLeaveNode);
        const dragLine = this.oldthis.dragLine.bind({oldthis: this.oldthis, startNode: this.node});
        canvas.addEventListener("mousemove", dragLine);
        const mouseupListener = (event) => {
            let nearestNode = this.oldthis.checkNearNodes.bind({oldthis: this.oldthis, drawing: true})(event)
            this.oldthis.drawNodes(this.oldthis.props.nodes, {drawOnly: true})
            canvas.removeEventListener("mousemove", dragLine);
            canvas.removeEventListener("mousedown", this.oldthis.state.drawLine);
            // add nearNodeListener back in
            this.oldthis.checkNearNodes.bind({node: nearestNode, oldthis: this.oldthis})(event)
            canvas.addEventListener("mousemove", this.oldthis.state.nearNodeListener);
            canvas.removeEventListener("mouseup", mouseupListener);
        }
        canvas.addEventListener("mouseup", mouseupListener);
    }

    checkNearNodes = function(event){
        // when this is bound to the drawing function
        if (this.drawing === true){
            let mousePos = this.oldthis.getMousePosition(event);
            let canvas = this.oldthis.canvas.current;
            let currentNode = this.currentNode;
            let nearestNode = null
            Object.keys(this.oldthis.props.nodes).map(key => {
                const node = this.oldthis.props.nodes[key]
                if (this.oldthis.getDistance(mousePos, node) < 7){
                    nearestNode = {...node};
                }
            })
            return nearestNode;

        // when passed a node to simulate being near it
        } else if (this.node !== undefined && this.node !== null) {
            console.log(node)
            let node = this.node
            let canvas = this.oldthis.canvas.current;
            this.oldthis.setState((prevState) => {
                canvas.removeEventListener("mousedown", prevState.drawLine)
                canvas.removeEventListener("mousemove", prevState.checkLeaveNode);
                return{
                    checkLeaveNode: this.oldthis.checkLeaveNode.bind({oldthis: this.oldthis, node: node}),
                    drawLine: this.oldthis.drawLine.bind({oldthis: this.oldthis, node: node})
                }
            }, () => {
                canvas.addEventListener("mousedown", this.oldthis.state.drawLine)
                canvas.addEventListener("mousemove", this.oldthis.state.checkLeaveNode);
            })

        } else if (this.state !== undefined) {
            let mousePos = this.getMousePosition(event);
            let canvas = this.canvas.current;
            let onNode = false;
            let currentNode = this.state.currentNode;
            
            Object.keys(this.props.nodes).map(key => {
                const node = this.props.nodes[key]
                if (this.getDistance(mousePos, node) < 7){
                    this.drawSingleNode(node, {color: "red"});
                    this.setState((prevState) => {
                        canvas.removeEventListener("mousedown", prevState.drawLine)
                        canvas.removeEventListener("mousemove", prevState.checkLeaveNode);
                        return{
                            checkLeaveNode: this.checkLeaveNode.bind({oldthis: this, node: node}),
                            drawLine: this.drawLine.bind({oldthis: this, node: node})
                        }
                    }, () => {
                        canvas.addEventListener("mousedown", this.state.drawLine)
                        canvas.addEventListener("mousemove", this.state.checkLeaveNode);
                    })
                }
            })
            if (this.state.onNode !== onNode){
                this.setState({onNode: onNode})
            }
            return null

        }
    }

    getDistance = (mousePos, node) => {
        const distance = ((mousePos.x-node.coordinates.x) ** 2 + (mousePos.y-node.coordinates.y) ** 2) ** 0.5
        return distance
    }

    componentDidUpdate =(prevProps, prevState) => {
        if (JSON.stringify(prevProps.nodes) !== JSON.stringify(this.props.nodes) ||
            JSON.stringify(prevProps.members) !== JSON.stringify(this.props.members) || 
            prevState.width !== this.state.width || prevState.height !== this.state.height){
            if (JSON.stringify(prevProps.nodes !== JSON.stringify(this.props.nodes))){
                this.drawNodes(this.props.nodes)
            }
        }

    }


    render(){
        return (
            <canvas ref={this.canvas} className={classes.Canvas} id="canvas" width={this.state.width} height={this.state.height}>
            </canvas>
        )
    }
}

export default Canvas;