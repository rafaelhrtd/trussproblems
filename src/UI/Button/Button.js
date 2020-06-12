import React from 'react';
import classes from './Button.css';

const Button = (props) => {
    return (
        <div className={classes[props.class]} onClick={props.clicked}>
            {props.children}
        </div>
    )
}