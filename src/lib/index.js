import React, { Component } from 'react';
import update from 'react/lib/update';
import createPlotlyComponent from 'react-plotlyjs';
import Plotly from 'plotly.js/dist/plotly-cartesian';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import AxisDropZone from './components/AxisDropZone.react.js';
import Box from './components/Box.react.js';

import getPlotJsonFromState from './components/getPlotJsonFromState.js'
import {PLOT_TYPES, controlPanelStyle, columnLabelStyle, submitStyle} from './components/editorConstants';


@DragDropContext(HTML5Backend)
export default class ChartEditor extends Component {

    constructor(props) {
        super(props);

        this.handleRemove = this.handleRemove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleSelect = this.handleSelect.bind(this);

        let columnTraceTypes = [];
        this.props.columnNames.map(colName => (columnTraceTypes[colName] = 'scatter'));

        this.state = {
            xAxisColumnName: this.props.columnNames[0],
            yAxisColumnNames: [this.props.columnNames[1]],
            boxes: this.props.columnNames.map(colName => ({name: colName, type: 'column'})),
            columnTraceTypes: columnTraceTypes,          
            droppedBoxNames: [],
            selectedColumn: '',
            selectedChartType: 'scatter',
        };
    }

    isDropped(boxName) {
        return this.state.droppedBoxNames.indexOf(boxName) > -1;
    }

    render() {

        const PlotlyComponent = createPlotlyComponent(Plotly);
        const { boxes, selectedColumn, selectedChartType } = this.state;
        const columnLabel = selectedColumn ? 
            'Select a chart type for ' + selectedColumn : 
            'Select a chart type';

        const plotJSON = getPlotJsonFromState(this.state, this.props);

        return (
            <div style={{fontFamily:'Open Sans, Sans-Serif'}}>
                <div style={controlPanelStyle}>
                    <div style={{marginBottom:'10px'}}>
                        <label style={columnLabelStyle}>{columnLabel}</label>
                        <select 
                            onChange={this.handleSelect}
                            style={{display:'inline-block', outline:'none'}}
                            value={selectedChartType}
                        >
                            {PLOT_TYPES.map((opt, i) =>
                                <option key={i} value={opt.value}>{opt.label}</option>
                            )}                    
                        </select>
                        <form
                            action='https://plot.ly/external'
                            method='post'
                            target='_blank'
                            name='data'
                            style={{display:'inline-block', margin:'0 10px'}}
                        >
                            <input type='hidden' name='data' value={JSON.stringify(plotJSON)} />
                            <input 
                                type="submit" 
                                style={submitStyle}
                                value="Edit on plot.ly" 
                            />
                        </form>
                    </div>
                    <div>
                        {boxes.map(({ name, type }, index) =>
                            <Box
                                name={name}
                                type={type}
                                isDropped={this.isDropped(name)}
                                key={index}
                            />
                        )}
                    </div>
                </div>              
                <div>
                    <div style={{float:'left', height:'400px'}}>
                        <AxisDropZone
                            accepts={['column']}
                            onDrop={item => this.handleDrop(item, 'yaxis')}
                            removeDroppedItem={this.handleRemove}
                            handleClick={this.handleClick}
                            key={1}
                            dropType='yaxis'
                            droppedItems={this.state.yAxisColumnNames}
                            selectedColumn={this.state.selectedColumn}
                        />
                    </div>
                    <div style={{marginLeft:'160px', position:'relative'}}>                       
                        <PlotlyComponent
                            data={plotJSON.data} 
                            layout={plotJSON.layout} 
                            config={{editable: true}}
                        />
                    </div>
                </div>
                <AxisDropZone
                    accepts={['column']}
                    onDrop={item => this.handleDrop(item ,'xaxis')}
                    removeDroppedItem={this.handleRemove}
                    key={0}
                    dropType='xaxis'
                    droppedItems={[this.state.xAxisColumnName]}
                    selectedColumn={this.state.selectedColumn}
                />               
            </div>
        );
    }

    handleRemove(colName, axisType) {
        let selectedColumn = this.state.selectedColumn;

        if (colName === selectedColumn) {
            selectedColumn = '';
        }

        if (axisType === 'xaxis') {
            this.setState({
                xAxisColumnName: '',
                selectedColumn: selectedColumn
            });
        }
        else if (axisType === 'yaxis') {
            this.setState({
                yAxisColumnNames: this.state.yAxisColumnNames.filter(val => val !== colName),
                selectedColumn: selectedColumn
            });
        }     
    }

    handleSelect(event) {
        const traceType = event.target.value;
        const selectedColumn = this.state.selectedColumn;
        let columnTraceTypes = this.state.columnTraceTypes;

        if (selectedColumn) {
            columnTraceTypes[selectedColumn] = traceType;
        }
        else{
            this.props.columnNames.map(colName => (columnTraceTypes[colName] = traceType));
        }

        this.setState({
            columnTraceTypes: columnTraceTypes,
            selectedChartType: traceType
        });
    }

    handleClick(colName) {
        if (colName === this.state.selectedColumn) {
            this.setState({selectedColumn: ''});
        }
        else{
            this.setState({
                selectedColumn: colName,
                selectedChartType: this.state.columnTraceTypes[colName]
            });
        }
    }

    handleDrop(item, axisType) {
        console.log(axisType);
        const { name } = item;

        if (axisType === 'xaxis') {
            this.setState(update(this.state, {
                droppedBoxNames: name ? {
                    $push: [name],
                } : {},
                xAxisColumnName: {
                    $set: name,
                },
            }));
        }
        else if (axisType === 'yaxis') {
            this.setState(update(this.state, {
                droppedBoxNames: name ? {
                    $push: [name],
                } : {},                
                yAxisColumnNames: name ? {
                    $push: [name],
                } : {},
                selectedColumn: {
                    $set: name
                }
            }));            
        }
    }    
}