import React from 'react';
import classes from './Button.css';

const Button = (props) => {
    return (
        <div className={classes.Container}>
            <div className={classes[props.className]} onClick={props.clicked}>
                {props.children}
            </div>
        </div>
    )
}

export default Button;