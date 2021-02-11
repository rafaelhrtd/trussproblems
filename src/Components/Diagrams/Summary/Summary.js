import React from 'react';
import classes from './Summary.scss';
import Aux from '../../../hoc/Aux/Aux';
import Latex from 'react-latex';

const sigFigs = (number) => {
    if (Math.abs(number) < 1E-9){
        return 0;
    } else if (Math.abs(number % 1) < 1E-9) { 
        return number;
    } else {
        return number.toPrecision(4);
    }
}

const units = {
    m: "kN-m",
    x: "m",
    f: "kN"
}

const Summary = (props) => {
    const equations = Object.keys(props.equations).map(equationKey => {
        const eq = props.equations[equationKey]
        const text = "$$" + eq.equation + "," + eq.range + "$$";
        console.log(text);
        return (
            <Latex displayMode={true}>{text}</Latex>
        )
    })
    return(
        <div className={classes.Summary}>
            <h3>Equations</h3>
            {equations}
        </div>
    )
}

export default Summary;