import React, { Component } from 'react';
import classes from './Canvas.css';
import Aux from '../../hoc/Aux/Aux';
import allContext from '../../context/allContext'
import { drawNodes } from '../../helpers/canvasHelpers'

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

    componentWillUmount = () => {
        window.removeEventListener('resize', this.handleResize);      
    }

    componentDidUpdate =(prevProps, prevState) => {
        console.log(this.props)
        if (JSON.stringify(prevProps.nodes) !== JSON.stringify(this.props.nodes) || 
            prevState.width !== this.state.width || prevState.height !== this.state.height ||
            JSON.stringify(prevProps.members) !== JSON.stringify(this.props.members) ||
            JSON.stringify(prevProps.forces) !== JSON.stringify(this.props.forces)){
                drawNodes.bind(this)()
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