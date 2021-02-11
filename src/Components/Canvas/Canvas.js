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
            height: height < 400 ? 400 : height,
            width: width < 400 ? 400 : width
        });
    }
    
    componentDidMount = () => {
        this.handleResize();
        console.log('did mount')
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount = () => {
        console.log('unmounted')
        window.removeEventListener('resize', this.handleResize);      
    }

    componentDidUpdate =(prevProps, prevState) => {
        if (JSON.stringify(prevProps.nodes) !== JSON.stringify(this.props.nodes) || 
            prevState.width !== this.state.width || prevState.height !== this.state.height ||
            JSON.stringify(prevProps.members) !== JSON.stringify(this.props.members) ||
            JSON.stringify(prevProps.forces) !== JSON.stringify(this.props.forces) || 
            JSON.stringify(prevProps.moments) !== JSON.stringify(this.props.moments) || 
            JSON.stringify(prevProps.supports) !== JSON.stringify(this.props.supports) ||
            prevProps.solved !== this.props.solved)
            {
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