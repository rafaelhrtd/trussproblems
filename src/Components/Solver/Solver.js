import React, { Component } from 'react';
import Button from '../../UI/Button/Button';
import classes from './Solver.css';
import allContext from '../../context/allContext'
import { allNodesConnected, linearEquationSystem } from './SolverHelper';
import Aux from '../../hoc/Aux/Aux';
class Solver extends Component {    
    state = {
    }

    componentDidMount = () => {
        let nodesConnected = allNodesConnected.bind(this)()
        this.setState({
            nodesConnected: nodesConnected
        })
    }

    componentDidUpdate(prevProps, prevState){
        let nodesConnected = this.state.nodesConnected
        if (JSON.stringify(this.props.nodes) !== JSON.stringify(prevProps.nodes) ||
            JSON.stringify(this.props.members) !== JSON.stringify(prevProps.members)){
            nodesConnected = allNodesConnected.bind(this)()
        }
        if (prevState.nodesConnected !== nodesConnected){
            this.setState({
                nodesConnected: nodesConnected});
        }
    }

    shouldComponentUpdate = (nextProps, nextState) => {
        return true
    }


    render(){
        return(
            <Aux>
                <Button className='Solver' clicked={linearEquationSystem.bind(this)}>
                    Solve
                </Button>
            </Aux>
        )
    }
}

export default Solver;