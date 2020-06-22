import React, { Component } from 'react';
import allContext from '../../../context/allContext';
import classes from './Sidebar.css';
import Form from '../../../UI/Form/Form';
import {Links, formValidity, formFromString} from './sidebarHelper';
import Aux from '../../../hoc/Aux/Aux'

class Sidebar extends Component {
    static contextType = allContext;
    state = {
        form: null // Node.bind(this)()
    }

    submitHandler = (event) => {
        event.preventDefault()
        let errors = formValidity(this.state.form, this.context)
        if (Object.keys(errors).length > 0){
            this.setState({errors: errors})
        } else {
            this.setState({errors: {}, form: null})
            this.state.form.submitFunction(this.state.form.inputElements)
        }
    }

    deleteElementHandler = (inputElements) =>{
        this.context.deleteElement(inputElements)
        this.setState({form: null})
    }

    componentDidMount = () => {
    }

    changeHandler = (event) => {
        event.persist()
        this.setState((prevState)=>{
            let form = {...prevState.form}
            let inputElements = {...form.inputElements}
            inputElements[event.target.name].value = event.target.value
            form.inputElements = inputElements
            return ({
                form: form
            })
        })
    }

    componentDidUpdate(prevProps, prevState){
        if (this.context.focus){
            const focus = this.context.focus
            let form = formFromString.bind(this)(focus.type)
            Object.keys(form.inputElements).map(key => {
                const name = form.inputElements[key].name
                form.inputElements[key].value = focus.item[name]
                form.inputElements.edit = true
                form.inputElements.type = focus.type
                form.inputElements.id = focus.item.id
            })
            if (JSON.stringify(prevState.form) !== JSON.stringify(form)){
                this.setState({form: form})
            }
        }
    }

    clickedHandler = (form) => {
        this.setState({form: form});
    }

    clickedBackHandler = () => {
        this.setState({form: null});
    }

    render(){
        const links = Links.bind(this)();
        const linkItems = Object.keys(links).map(key => {
            const link = links[key]
            if (link.options){
                return (
                    <li className={classes.menuItem} key={link.name}>
                        {link.name}
                        <ul className={classes.options}>
                            {Object.keys(link.options).map(key => (
                                <li className={classes.option}
                                    onClick={() => this.clickedHandler(link.options[key].form())}>
                                    {link.options[key].title}
                                </li>
                            ))}
                        </ul>
                    </li>
                )
            } else {
                return (
                    <li 
                        key={link.name}
                        className={classes.menuItem}
                        onClick={() => this.clickedHandler(link.form())}>
                        {link.name}
                    </li>
                )
            }
        })

        const errors = this.state.errors ? (
            <ul className={classes.Errors}>
                {
                    this.state.errors.form ? (
                        Object.keys(this.state.errors.form).map(key => (
                            <li className={classes.Error}>
                                {this.state.errors.form[key].errorMessage}
                            </li>
                        ))
                    ) : (
                        Object.keys(this.state.errors).map(key => {
                            return Object.keys(this.state.errors[key]).map(innerKey => (
                                <li className={classes.Error}>
                                    {this.state.errors[key][innerKey].errorMessage}
                                </li>
                            ))
                        })
                    )
                }

            </ul>
        ) : null
        return(

            <div className={classes.Sidebar} onClick={() => this.context.setFocusItem(null, null)}>
                {this.state.form === null ? (
                    <ul className={classes.Menu}>
                        {linkItems}
                    </ul>
                ) : (
                    <Aux>
                        {errors}
                        <Form 
                            element={this.state.form}
                            changed={this.changeHandler}
                            submit={this.submitHandler}
                            back={this.clickedBackHandler}
                            delete={this.deleteElementHandler}/>
                    </Aux>
                )}
            </div>
        )
    }
}

export default Sidebar