import React from 'react';
import classes from './Summary.css';
import Aux from '../../../hoc/Aux/Aux';

const sigFigs = (number) => {
    if (Math.abs(number) < 1E-9){
        return 0;
    } else if (Math.abs(number % 1) < 1E-9) { 
        return number;
    } else {
        return number.toFixed(3);
    }
}

const units = {
    m: "kN-m",
    x: "m",
    f: "kN"
}

const Summary = (props) => {
    console.log(props.data.intersections);
    let intersectionText = "["
    for (let i = 0 ; i < props.data.intersections.length ; i++){
        if (i === (props.data.intersections.length-1)){
            intersectionText += sigFigs(props.data.intersections[i]) + "]";
        } else {
            intersectionText += sigFigs(props.data.intersections[i]) + ", ";
        }
    }
    const intersections = props.data.intersections.length === 0 ? (
        <h5>No intersections</h5>
    ) : (
        <Aux>
            <h5>Intersections</h5>
            <p>x = {intersectionText}</p>
        </Aux>
    )
    return(
        <div className={classes.Summary}>
            <h5>Maximum</h5>
        <p>{sigFigs(props.data.max.y)} {units[props.unit]} at x = {sigFigs(props.data.min.x)} {units.x}</p>
            <h5>Minimum</h5>
            <p>{sigFigs(props.data.min.y)} {units[props.unit]} at x = {sigFigs(props.data.min.x)} {units.x}</p>
            {intersections}
        </div>
    )
}

export default Summary;