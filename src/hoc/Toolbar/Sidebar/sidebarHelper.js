// will handle the forms for all elements
export const Node = function(){
    return {
        element: "node",
        name: "node",
        inputElements: {
            x: {
                elementType: 'text',
                name: "x",
                placeholder: "x-position",
                validation: {
                    required: true,
                    numericality: true
                },
                value: ''
            },
            y: {
                elementType: 'text',
                name: "y",
                placeholder: "y-position",
                validation: {
                    required: true,
                    numericality: true
                },
                value: ''
            },
        },
        validation: {
            unique: true
        },
        submitText: "Add node",
        submitFunction: this.context.addNode,
        validate: formValidity
    }
}

export const Member = function(){
    const nodes = this.context.nodes;
    return {
        element: "member",
        name: "member",
        inputElements: {
            nodeA: {
                elementType: 'select',
                placeholder: 'Node A',
                name: 'nodeA',
                validation: { required: true },
                options:
                    Object.keys(nodes).map(key => (
                        {
                            value: nodes[key].id,
                            displayValue: "Node " + nodes[key].id
                        }
                    ))
            },
            nodeB: {
                elementType: 'select',
                placeholder: 'Node B',
                validation: { required: true },
                name: 'nodeB',
                options: 
                    Object.keys(nodes).map(key => (
                        {
                            value: nodes[key].id,
                            displayValue: "Node " + nodes[key].id
                        }
                    ))
            },
        },
        validation: {
            unique: true,
            differentNodes: true
        },
        submitText: "Add member",
        submitFunction: this.context.addMember
    }
}

export const memberForce = function(){
    const members = this.context.members;
    return {
        element: "memberForce",
        name: "force",
        inputElements: {
            member: {
                elementType: 'select',
                placeholder: 'Member',
                name: 'member',
                validation: {
                    required: true
                },
                options: 
                    Object.keys(members).map(key => ({
                        value: members[key].id,
                        displayValue: "Member " + members[key].id
                    }))
            },
            forceType: {
                elementType: 'select',
                placeholder: 'Force type',
                name: 'forceType',
                validation: {
                    required: true
                },
                options: [
                    {value: "distributed", displayValue: "Distributed"},
                    {value: "point", displayValue: "Point Load"}
                ]
            },
            startPoint: {
                elementType: 'text',
                placeholder: 'Start point (%)',
                name: "startPoint",
                validation: {
                    required: true,
                    numericality: true
                },
                onlyIf: {
                    forceType: "distributed"
                }
            },
            endPoint: {
                elementType: 'text',
                placeholder: 'End point (%)',
                name: "endPoint",
                validation: {
                    required: true,
                    numericality: true
                },
                onlyIf: {
                    forceType: "distributed"
                }
            },
            startXForce: {
                elementType: 'text',
                placeholder: 'Start x force',
                name: "startXForce",
                validation: {
                    required: true,
                    numericality: true
                },
                onlyIf: {
                    forceType: "distributed"
                }
            },
            endXForce: {
                elementType: 'text',
                placeholder: 'End x force',
                name: "endXForce",
                validation: {
                    required: true,
                    numericality: true
                },
                onlyIf: {
                    forceType: "distributed"
                }
            },
            startYForce: {
                elementType: 'text',
                placeholder: 'Start y force',
                name: "startYForce",
                validation: {
                    required: true,
                    numericality: true
                },
                onlyIf: {
                    forceType: "distributed"
                }
            },
            endYForce: {
                elementType: 'text',
                placeholder: 'End y force',
                name: "endYForce",
                validation: {
                    required: true,
                    numericality: true
                },
                onlyIf: {
                    forceType: "distributed"
                }
            },
            xForce: {
                elementType: 'text',
                placeholder: 'x-force',
                name: "xForce",
                validation: {
                    required: true,
                    numericality: true
                },
                onlyIf: {
                    forceType: "point"
                }
            },
            yForce: {
                elementType: 'text',
                placeholder: 'y-force',
                name: "yForce",
                validation: {
                    required: true,
                    numericality: true
                },
                onlyIf: {
                    forceType: "point"
                }
            },
            location: {
                elementType: 'text',
                placeholder: 'Location (%)',
                name: "location",
                validation: {
                    required: true,
                    numericality: true
                },
                onlyIf: {
                    forceType: "point"
                }
            },
        },
        validation: {
            unique: true
        },
        submitText: "Add force",
        submitFunction: this.context.addMemberForce
    }
}

export const nodeForce = function(){
    const nodes = this.context.nodes;
    return {
        element: "nodeForce",
        name: "force",
        inputElements: {
            node: {
                elementType: 'select',
                placeholder: 'Node',
                name: 'node',
                validation: {
                    required: true
                },
                options: 
                Object.keys(nodes).map(key => (
                    {
                        value: nodes[key].id,
                        displayValue: "Node " + nodes[key].id
                    }
                ))
            },
            xForce: {
                elementType: 'text',
                placeholder: 'x-force',
                name: "xForce",
                validation: {
                    required: true,
                    numericality: true
                }
            },
            yForce: {
                elementType: 'text',
                placeholder: 'y-force',
                name: "yForce",
                validation: {
                    required: true,
                    numericality: true
                }
            },
        },
        validation: {
            unique: true
        },
        submitText: "Add force",
        submitFunction: this.context.addNodeForce
    }
}

export const support = function(){
    return 1
}

export const Links = function(){
    return({
        node: {
            form: Node.bind(this),
            name: "Nodes"
        },
        member: {
            form: Member.bind(this),
            name: "Members"
        },
        force: {
            name: "Forces",
            options: {
                forceOnNode: {
                    form: nodeForce.bind(this),
                    title: "Force on node"
                },
                forceOnMember: {
                    form: memberForce.bind(this),
                    title: "Force on member"
                }
            }
        },
        support: {
            name: "Supports",
            form: () => {return null}
        }
    })
}

export const checkValidity = function(inputElement){
    let validationTests = {};
    const rules = inputElement.validation
    const value = inputElement.value !== null && inputElement.value !== undefined ? inputElement.value : ''
    if (rules && rules.required){
        validationTests.required = {
            valid: value.toString().trim() !== '',
            errorMessage: inputElement.placeholder + " must be present."
        }
        if (!validationTests.required.valid){
        }
    }
    if (rules && rules.numericality){
        validationTests.numericality = {
            valid: value.toString().match(/[^-?\d\.]/) === null,
            errorMessage: inputElement.placeholder + " must be a number"
        }
    }
    let errors = {}
    Object.keys(validationTests).map(key => {
        if (!validationTests[key].valid){
            errors[key] = validationTests[key]
        }
    })
    return errors
}

export const formFromString = function(string){
    switch(string){
        case 'node':
            return Node.bind(this)()
            break;
        case 'member':
            return Member.bind(this)()
            break;
        case 'force':
            if (this.context.focus.item.member){
                return memberForce.bind(this)()
            } else if (this.context.focus.item.node){
                return nodeForce.bind(this)()
            }
            break;
        case 'support':
            return support.bind(this)()
            break;
    }
}

export const formValidity = function(form, context){
    let validationTests = {};
    let rules = form.validation
    if (rules.unique){
        if (form.element === "node") {
            let valid = true
            Object.keys(context.nodes).map(key => {
                const node = context.nodes[key]
                if (Math.abs(node.x - parseFloat(form.inputElements.x.value)) < 1E-8 && 
                    Math.abs(node.y - parseFloat(form.inputElements.y.value)) < 1E-8){
                    valid = false;
                }
            })
            validationTests.unique = {
                valid: valid,
                errorMessage: "Another node already exists at this location."
            }
        } else if (form.element === "member") {
            let valid = true
            Object.keys(context.members).map(key => {
                const member = context.members[key]
                if ((member.nodeA === parseInt(form.inputElements.nodeA.value) || member.nodeB === parseInt(form.inputElements.value)) && 
                    (member.nodeA === parseInt(form.inputElements.value) || member.nodeB === parseInt(form.inputElements.value))){
                    valid = false;
                }
            })
            validationTests.unique = {
                valid: valid,
                errorMessage: "Another member already exists at this location."
            }
        } else if (form.element === "nodeForce") {
            let valid = true
            Object.keys(context.forces).map(key => {
                const force = context.forces[key]
                if (force.node === parseInt(form.inputElements.node.value)  && form.inputElements.id !== force.id) {
                    valid = false
                }
            })
            validationTests.unique = {
                valid: valid,
                errorMessage: "Another force already exists at this location."
            }
        } else if (form.element === "memberForce"){
            let valid = true 
            Object.keys(context.forces).map(key => {
                const force = context.forces[key]
                if (form.inputElements.forceType.value === 'point' && force.forceType === 'point' && form.inputElements.id !== force.id){
                    if (Math.abs(force.location - parseFloat(form.inputElements.location.value)) < 1E-5 && 
                        force.member === form.inputElements.member.value){
                        valid = false
                    }
                } else if (form.inputElements.forceType.value === 'distributed' && force.forceType === 'distributed' && form.inputElements.id !== force.id) {
                    if (Math.abs(parseFloat(form.inputElements.startPoint.value) - force.startPoint) < 1E-5 &&
                        Math.abs(parseFloat(form.inputElements.endPoint.value) - force.endPoint) < 1E-5 && 
                        force.member === form.inputElements.member.value){
                        valid = false
                    }
                }
            })
            validationTests.unique = {
                valid: valid,
                errorMessage: "Another force already exists at this location."
            }
            
        } else if (form.element === "support") {
            let valid = true
            Object.keys(context.supports).map(key => {
                const support = context.supports[key]
                if (support.node === parseInt(form.node.value)){
                    valid = false;
                }
            })
            validationTests.unique = {
                valid: valid,
                errorMessage: "Another support already exists at this location."
            }

        }
        if (rules.differentNodes){
            if (form.element === "member"){
                let valid = true 
                if (form.inputElements.nodeA.value === form.inputElements.nodeB.value){
                    valid = false
                }
                validationTests.unique = {
                    valid: valid,
                    errorMessage: "The nodes must be different."
                }
            }
        }
    }

    let errors = {}
    // check for errors in each form element
    Object.keys(form.inputElements).map(key => {
        // check if the element is being accepted
        if (requirementsMet.bind({form: form, inputElement: form.inputElements[key]})()){
            const inputElement = form.inputElements[key]
            let inputErrors = checkValidity(inputElement)
            // if errors are found for this, make it known
            if (Object.keys(inputErrors).length > 0){
                errors[form.inputElements[key].name] = inputErrors
            }
        }
    })

    Object.keys(validationTests).map(key => {
        if (!validationTests[key].valid){
            errors['form'] = {}
            errors['form'][key] = validationTests[key]
        }
    })
    return errors
}

const requirementsMet = function(){
    if (this.inputElement.onlyIf){
        const reqValue = this.inputElement.onlyIf[Object.keys(this.inputElement.onlyIf)[0]]
        const currentValue = this.form.inputElements[Object.keys(this.inputElement.onlyIf)[0]].value
        return (reqValue === currentValue)
    } else {
        return true
    }
}