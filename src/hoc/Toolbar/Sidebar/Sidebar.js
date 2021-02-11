import React, { Component } from 'react';
import allContext from '../../../context/allContext';
import classes from './Sidebar.scss';
import Form from '../../../UI/Form/Form';
import {Links, formValidity, formFromString} from './sidebarHelper';
import Aux from '../../../hoc/Aux/Aux';
import Solver from '../../../Components/Solver/Solver';
import Button from '../../../UI/Button/Button';

class Sidebar extends Component {
    static contextType = allContext;
    state = {
        form: null,
        seeForces: false
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
        // pass state 
        let trussChanged = (JSON.stringify(this.state.nodes) !== JSON.stringify(this.context.nodes)
            || JSON.stringify(this.state.members) !== JSON.stringify(this.context.members)
            || JSON.stringify(this.state.forces) !== JSON.stringify(this.context.forces)
            || JSON.stringify(this.state.supports) !== JSON.stringify(this.context.supports))

        if (JSON.stringify(this.state.nodes) !== JSON.stringify(this.context.nodes)
            || JSON.stringify(this.state.members) !== JSON.stringify(this.context.members)
            || JSON.stringify(this.state.forces) !== JSON.stringify(this.context.forces)
            || JSON.stringify(this.state.supports) !== JSON.stringify(this.context.supports)){
            
            this.setState({
                nodes: this.context.nodes,
                members: this.context.members,
                forces: this.context.forces,
                supports: this.context.supports,
                moments: this.context.moments
            }, () => {
            })
        } 
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
                                    key={link.options[key].title}
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
        if (this.context.solved){
            if (this.context.truss){
                if (this.context.focus && this.context.focus.type === 'member'){
                    if (!this.state.seeForces){
                        
                    }
                }
            } else if (this.context.frame){
                return(
                    <div className={[classes.Sidebar, classes.solved].join(" ")}>
                        <h1>Statics Solver</h1>
                        <h2>Member {this.context.focus.item.id}</h2>
                        <p>Node A: {this.context.focus.item.nodeA}<br/>
                        Node B: {this.context.focus.item.nodeB}</p>
                        <p>All diagrams start at node A and finish at node B.</p>
                    <Button className='Solver' clicked={() => this.context.removeFocus()}>
                        Back to solution
                    </Button>
                    </div>
                )

            } else {
                return(
                    <div className={[classes.Sidebar, classes.solved].join(" ")}>
                        <h1>Structure successfully solved</h1>
                        <p>Select members to see internal reactions and diagrams.</p>
                    <Button className='Solver' clicked={() => this.context.backToBuilder()}>
                        Back to builder
                    </Button>
                    </div>
                )
                
            }

        } else {
            return(
                <div className={classes.Sidebar} onClick={() => this.context.setFocusItem(null, null)}>
                    {this.state.form === null ? (
                        <Aux>
                            <h1>Statics Solver</h1>
                            <ul className={classes.Menu}>
                                {linkItems}
                            </ul>
                            <Solver
                                nodes={{...this.state.nodes}}
                                members={{...this.state.members}}
                                forces={{...this.state.forces}}
                                supports={{...this.state.supports}}
                                moments={{...this.state.moments}}
                                addSupportReactions={this.context.addSupportReactions}
                                addMemberReactions={this.context.addMemberReactions}
                                addTrussCheck={this.context.addTrussCheck}
                                addSolutionErrors={this.context.addSolutionErrors}
                                errors={this.context.solutionErrors}
                                solve={this.context.solved} />
                        </Aux>
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
}

export default Sidebar