import React, { Component } from 'react';
import Aux from '../../hoc/Aux/Aux'

class Input extends Component {
    render(){
        let input = null;
        const inputElement = this.props.inputElement
        switch(inputElement.elementType){
            case 'text':
                input = (
                    <input 
                        type='text' 
                        key={inputElement.name}
                        placeholder={inputElement.placeholder} 
                        name={inputElement.name}
                        value={inputElement.value}
                        autoComplete="off"
                        onChange={event => this.props.changed(event)} />
                )
                break
            case 'select':
                input = (
                    <select key={inputElement.name}
                        onChange={event => this.props.changed(event)}
                        name={inputElement.name}>
                        <option value={null}>
                            {inputElement.placeholder}
                        </option>
                        {inputElement.options.map(option => (
                            <option 
                                key={inputElement.name + option.value} 
                                selected={inputElement.value === option.value} 
                                value={option.value}>
                                {option.displayValue}
                            </option>
                        ))}
                    </select>
                )
                break
        }
        return(
            <Aux>
                {input}
            </Aux>
        )
    }
}

export default Input;