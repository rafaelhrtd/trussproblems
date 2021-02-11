import React, {Component} from 'react';
import allContext from '../../context/allContext';
import classes from './Diagrams.scss';
import { ScatterChart, ResponsiveContainer, Label, Scatter, CartesianGrid, XAxis, YAxis } from 'recharts';
import Summary from './Summary/Summary';
import Latex from 'react-latex';

class Diagrams extends Component {
    static contextType = allContext;

    findMaximum = (data) => {
        data = this.dataCleanup(data);
        let max = data[0];
        for (let i = 0; i < data.length ; i++){
            if (data[i].y > max.y){
                max = data[i];
            }
        }
        return max;
    }

    sigFigs = (number) => {
        if (Math.abs(number) < 1E-9){
            return 0;
        } else if (Math.abs(number % 1) < 1E-9) { 
            return number;
        } else {
            return number.toPrecision(4);
        }
    }

    findMinimum = (data) => {
        data = this.dataCleanup(data);
        let max = data[0];
        for (let i = 0; i < data.length ; i++){
            if (data[i].y < max.y){
                max = data[i];
            }
        }
        return max;
    }

    getEquations = (equations) => {
        let processedEquations = {};
        for (let i = 0 ; i < Object.keys(equations).length ; i++){
            const eq  = equations[Object.keys(equations)[i]];
            processedEquations[i] = {equation: "", range: ""}
            if (i === 0){
                processedEquations[i].range += this.sigFigs(eq.start) + "\\leq x <" + this.sigFigs(eq.end);
            } else if (eq.start === eq.end){
                processedEquations[i].range += "x =" + this.sigFigs(eq.end);
            } else {
                processedEquations[i].range += this.sigFigs(eq.start) + "< x <" + this.sigFigs(eq.end);
            }
            let orders = Object.keys(eq.variables).map(order => (parseInt(order))).sort().reverse();
            console.log('orders');
            console.log(orders);
            for (let j = 0 ; j < orders.length ; j++){
                const order = orders[j];
                if (order !== 0 && Math.abs(eq.variables[order]) > 1E-8 && i !== Object.keys(equations).length - 1){
                    if (order === 1){
                        processedEquations[i].equation += (eq.variables[order] > 0 && j !== 0 ? "+" : "") + this.sigFigs(eq.variables[order]) + "x"
                    } else {
                        processedEquations[i].equation += (eq.variables[order] > 0 && j !== 0 ? "+" : "") + this.sigFigs(eq.variables[order]) + "x^"+order;
                    }
                } else if (processedEquations[i].equation === "" || Math.abs(eq.variables[order]) > 1E-8){
                    processedEquations[i].equation += (eq.variables[order] > 0 && j !== 0 ? "+" : "") + this.sigFigs(eq.variables[order]);
                }
            }
        }
        return processedEquations;
    }

    dataCleanup = (data) => {
        for (let i = 0; i < data.length ; i++){
            if (Math.abs(data[i].y) < 1E-9){
                data[i].y = 0;
            }
        }
        return data;
    }

    findIntersections = (data) => {
        data = this.dataCleanup(data);
        let intersections = []
        for (let i = 0 ; i < data.length ; i++){
            if (i === 0 && Math.abs(data[0].y) < 1E-8){
                intersections = [...intersections, 0];
            } else if (i === (data.length - 1) && Math.abs(data[data.length-1].y) < 1E-8){
                intersections = [...intersections, (data[data.length-1].x)];
            } else if (i !== 0) {
                if (data[i].y * data[i-1].y < 0){
                    intersections = [...intersections, ((data[i].x + data[i-1].x)/2)];
                } else if (Math.abs(data[i-1].y) < 1E-8 && Math.abs(data[i].y) > 1E-8){
                    intersections = [...intersections, ((data[i].x + data[i-1].x)/2)];
                }
            }
        }
        return intersections;
    }
    getInfo = (data) => {
        return{
            max: this.findMaximum(data),
            min: this.findMinimum(data),
            intersections: this.findIntersections(data)
        }
    }

    getYDomain = (data) => {
        return [data[0].x, Math.ceil(data[data.length-1].x)]
    }
    
    render(){
        const RenderNoShape = (props)=>{ 
            return null; 
           }
        const member = this.context.memberReactions[this.context.focus.item.id];
        const data = {
            n: member.data.n,
            s: member.data.s,
            m: member.data.m,
        }
        // get the summary information
        const nInfo = this.getInfo(data.n);
        const sInfo = this.getInfo(data.s);
        const mInfo = this.getInfo(data.m);
        const nEquations = this.getEquations(member.equations.n)
        const sEquations = this.getEquations(member.equations.s)
        const mEquations = this.getEquations(member.equations.m)
        console.log('nEquations')
        console.log(nEquations)

        const shearColor = "#d96d6d";
        const normalColor = "#4c9df4"
        const momentColor = "#69cc73"

        const normal = (
            <ResponsiveContainer width={'99%'} aspect={2}>
                <ScatterChart data={data} >
                    <Scatter 
                        name="A school" 
                        data={data.n} fill={normalColor} 
                        line={{stroke: normalColor, strokeWidth: 3}} 
                        shape={<RenderNoShape />}/>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="position"
                        domain={this.getYDomain(data.n)}/>
                    <YAxis 
                        type="number" 
                        dataKey="y" 
                        name="moment" >
                    </YAxis>
                </ScatterChart>
            </ResponsiveContainer>
        );

        const shear = (
            <ResponsiveContainer width={'99%'} aspect={2}>
                <ScatterChart data={data} >
                    <Scatter 
                        name="A school" 
                        data={data.s} fill={shearColor} 
                        line={{stroke: shearColor, strokeWidth: 3}} 
                        shape={<RenderNoShape />}/>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="position" 
                        domain={this.getYDomain(data.s)}/>
                    <YAxis 
                        type="number" 
                        dataKey="y" 
                        name="moment" >
                    </YAxis>
                </ScatterChart>
            </ResponsiveContainer>
        );

        const moment = (
            <ResponsiveContainer width={'99%'} aspect={2}>
                <ScatterChart data={data} >
                    <Scatter 
                        name="A school" 
                        data={data.m} fill={momentColor} 
                        line={{stroke: momentColor, strokeWidth: 3}} 
                        shape={<RenderNoShape />}/>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="position" 
                        domain={this.getYDomain(data.m)}/>
                    <YAxis 
                        type="number" 
                        dataKey="y" 
                        name="moment" >
                    </YAxis>
                </ScatterChart>
            </ResponsiveContainer>
        );
        return(
            <div className={classes.Diagrams}>
                <h1>Force and moment diagrams</h1>
                <h2>Member {this.context.focus.item.id}</h2>
                <div className={classes.plotHolder}>
                    <h3>Normal Force</h3>
                    <div className={classes.plot}>
                        {normal}
                    </div>
                    <div className={classes.information}>
                        <Summary equations={nEquations} unit="f" />

                    </div>
                </div>

                <div className={classes.plotHolder}>
                    <h3>Shear Force</h3>
                    <div className={classes.plot}>
                        {shear}
                    </div>
                    <div className={classes.information}>
                        <Summary equations={sEquations} unit="f" />
                    </div>
                </div>

                <div className={classes.plotHolder}>
                    <h3>Bending Moment</h3>
                    <div className={classes.plot}>
                        {moment}

                    </div>
                    <div className={classes.information}>
                        <Summary equations={mEquations} unit="m" />
                    </div>
                </div>
            </div>
        )
    }
}

export default Diagrams;