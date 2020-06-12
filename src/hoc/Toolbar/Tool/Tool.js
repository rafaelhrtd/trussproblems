import React, { Component } from 'react';
import classes from './Tool.css';
import Aux from '../../Aux/Aux.js';

class Tool extends Component {
    state = {}
    componentDidMount = () => {
        Object.keys(this.props.tool.form).map(key => {
            this.setState({[key]: null})
        })
    }
    changeHandler = (event) => {
        event.persist()
        this.setState(() => {
            console.log(event.target)
            return({[event.target.name]: event.target.value})
        })
    }
    submitHandler = (event) => {
        event.preventDefault();
        this.props.tool.submitFunction(this.state)
    }

    render(){
        const tool = this.props.tool
        return(
            <div className={classes.Tool}>
                <div className={classes.Button}>
                    {tool.submitText}
                </div>            
                <div className={classes.ToolForm}>
                    <form onSubmit={event => this.submitHandler(event)}>
                        {Object.keys(tool.form).map(key => {
                            const input = tool.form[key]
                            return (
                                <Aux key={key}>
                                <label>
                                    {input.name}
                                </label>
                                <input 
                                    type={input.type} 
                                    name={key} 
                                    value={this.state[input.name]}
                                    onChange={event => this.changeHandler(event)}>
                                </input>
                                </Aux>
                            )
                        })}

                        <input type="submit" value={tool.submitText} />
                    </form>
                </div>
            </div>
        )
    }
}

export default Tool;
