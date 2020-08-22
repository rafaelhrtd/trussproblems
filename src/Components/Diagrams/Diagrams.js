import React, {Component} from 'react';
import allContext from '../../context/allContext';
import classes from './Diagrams.scss';
import { ScatterChart, ResponsiveContainer, Label, Scatter, CartesianGrid, XAxis, YAxis } from 'recharts';
import Summary from './Summary/Summary';
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

        const shearColor = "#d96d6d";
        const normalColor = "#4c9df4"
        const momentColor = "#69cc73"

        const normal = (
            <ResponsiveContainer width={'100%'} height={300}>
                <ScatterChart data={data} >
                    <Scatter 
                        name="A school" 
                        data={data.n} fill={normalColor} 
                        line={{stroke: normalColor, strokeWidth: 2}} 
                        shape={<RenderNoShape />}/>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis 
                        label={{ value: '[m]', position: 'insideBottom'}}
                        type="number" 
                        dataKey="x" 
                        name="position"
                        domain={this.getYDomain(data.n)}
                        height={50}/>
                    <YAxis 
                        width={70}
                        type="number" 
                        dataKey="y" 
                        name="moment" >
                            <Label
                                value="[kN]"
                                angle={-90}
                                offset={20}
                                position="insideLeft"
                            />
                    </YAxis>
                </ScatterChart>
            </ResponsiveContainer>
        );

        const shear = (
            <ResponsiveContainer width={'100%'} height={300}>
                <ScatterChart data={data} >
                    <Scatter 
                        name="A school" 
                        data={data.s} fill={shearColor} 
                        line={{stroke: shearColor, strokeWidth: 2}} 
                        shape={<RenderNoShape />}/>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis 
                        label={{ value: '[m]', position: 'insideBottom'}}
                        type="number" 
                        dataKey="x" 
                        name="position" 
                        domain={this.getYDomain(data.s)}
                        height={50}/>
                    <YAxis 
                        width={70}
                        type="number" 
                        dataKey="y" 
                        name="moment" >
                            <Label
                                value="[kN]"
                                angle={-90}
                                offset={20}
                                position="insideLeft"
                            />
                    </YAxis>
                </ScatterChart>
            </ResponsiveContainer>
        );

        const moment = (
            <ResponsiveContainer width={'100%'} height={300}>
                <ScatterChart data={data} >
                    <Scatter 
                        name="A school" 
                        data={data.m} fill={momentColor} 
                        line={{stroke: momentColor, strokeWidth: 2}} 
                        shape={<RenderNoShape />}/>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis 
                        label={{ value: '[m]', position: 'insideBottom'}}
                        type="number" 
                        dataKey="x" 
                        name="position" 
                        domain={this.getYDomain(data.m)}
                        height={50}/>
                    <YAxis 
                        width={70}
                        type="number" 
                        dataKey="y" 
                        name="moment" >
                            <Label
                                value="[kN-m]"
                                angle={-90}
                                offset={20}
                                position="insideLeft"
                            />
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
                        <h4>Summary</h4>
                        <Summary data={nInfo} unit="f" />

                    </div>
                </div>

                <div className={classes.plotHolder}>
                    <h3>Shear Force</h3>
                    <div className={classes.plot}>
                        {shear}
                    </div>
                    <div className={classes.information}>
                        <h4>Summary</h4>
                        <Summary data={sInfo} unit="f" />
                    </div>
                </div>

                <div className={classes.plotHolder}>
                    <h3>Bending Moment</h3>
                    <div className={classes.plot}>
                        {moment}

                    </div>
                    <div className={classes.information}>
                        <h4>Summary</h4>
                        <Summary data={mInfo} unit="m" />
                    </div>
                </div>
            </div>
        )
    }
}

export default Diagrams;