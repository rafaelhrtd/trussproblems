import React, { Component } from 'react';
import Input from '../Input/Input';
import classes from './Form.scss';
import Aux from '../../hoc/Aux/Aux'
class Form extends Component {

    render() {
        const element = this.props.element
        const inputs = Object.keys(element.inputElements).map(key => {
            const input = element.inputElements[key]
            if (input.onlyIf){
                const reqValue = input.onlyIf[Object.keys(input.onlyIf)[0]]
                const currentValue = element.inputElements[Object.keys(input.onlyIf)[0]].value
                if( reqValue === currentValue ){
                    return (
                        <Aux
                        key={element.inputElements[key].name} >
                            <label>
                                {element.inputElements[key].placeholder}
                            </label>
                            <Input 
                                inputElement={element.inputElements[key]}
                                value={null}
                                changed={this.props.changed} />    
                        </Aux>
                        )
                } else {
                    return null
                }
            } else if (!input.onlyIf && element.inputElements[key].name) {
                return (
                    <Aux
                        key={element.inputElements[key].name} >
                        <label>
                            {element.inputElements[key].placeholder}
                        </label>
                        <Input 
                            inputElement={element.inputElements[key]}
                            value={null}
                            changed={this.props.changed} />    
                            <br/>
                    </Aux>
                )
            } else {
                return null
            }
        })
        
        return (
            <form className={classes.form} onSubmit={event => this.props.submit(event)}>
                <h2>{element.inputElements.edit ? 'Edit ' : 'New '} {this.props.element.name} {element.inputElements.edit ? element.inputElements.id : null}</h2>
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