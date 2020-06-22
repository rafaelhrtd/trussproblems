import React, { Component } from 'react';
import Input from '../Input/Input';
import classes from './Form.css';
import Aux from '../../hoc/Aux/Aux'
class Form extends Component {

    render() {
        const element = this.props.element
        const inputs = (
            <Aux>
                {Object.keys(element.inputElements).map(key => {
                    const input = element.inputElements[key]
                    if (input.onlyIf){
                        const reqValue = input.onlyIf[Object.keys(input.onlyIf)[0]]
                        const currentValue = element.inputElements[Object.keys(input.onlyIf)[0]].value
                        if( reqValue === currentValue ){
                            return (
                                <Aux>
                                    <label>
                                        {element.inputElements[key].placeholder}
                                    </label>
                                    <Input 
                                        key={element.inputElements[key].name} 
                                        inputElement={element.inputElements[key]}
                                        value={null}
                                        changed={this.props.changed} />    
                                </Aux>
                                )
                        } else {
                            return null
                        }
                    } else if (!input.onlyIf) {
                        return (
                            <Aux>
                                <label>
                                    {element.inputElements[key].placeholder}
                                </label>
                                <Input 
                                    key={element.inputElements[key].name} 
                                    inputElement={element.inputElements[key]}
                                    value={null}
                                    changed={this.props.changed} />    
                                    <br/>
                            </Aux>
                        )
                    } else {
                        return null
                    }
                    })}
            </Aux>
        )
        return (
            <form className={classes.form} onSubmit={event => this.props.submit(event)}>
                <h1>{element.inputElements.edit ? 'Edit ' : 'New '} {this.props.element.name} {element.inputElements.edit ? element.inputElements.id : null}</h1>
                {inputs}
                { element.inputElements.edit ? (
                    <div className={classes.button} onClick={() => {this.props.delete(element.inputElements)}}>
                        Delete
                    </div>
                ) : null}
                <input type="submit" value={(element.inputElements.edit ? 'Save ' : 'Add ') + element.name} />
                <div className={classes.button} onClick={this.props.back}>
                    Back
                </div>
            </form>
        )
    }
}

export default Form;