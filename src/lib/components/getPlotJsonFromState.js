
import {transpose} from 'ramda';
import {DEFAULT_DATA, DEFAULT_LAYOUT, DEFAULT_COLORS} from './editorConstants';

export default function getPlotJsonFromState(state, props) {        
    let data = DEFAULT_DATA;
    let layout = DEFAULT_LAYOUT;

    // Get chart data from props
    const allColumnNames = props.columnNames;
    const rowData = props.rows;

    // Get chart configuration from state
    const {xAxisColumnName, yAxisColumnNames, columnTraceTypes}  = state;

    const colsWithTraceTypes = Object.keys(columnTraceTypes);

    if (typeof allColumnNames !== undefined && typeof rowData !== undefined) {            
        data = [];
        const columnData = transpose(rowData);            
        let yColName = '';
        let xColumnData;            
        let yColumnData;
        let traceColor;
        let traceType;            
        let dataObj;

        // eslint-disable-next-line
        yAxisColumnNames.map((yColName, i) => {
            
            const numColors = DEFAULT_COLORS.length;
            const colorWheelIndex = parseInt(numColors * (i/numColors), 10);
            traceColor = DEFAULT_COLORS[colorWheelIndex];
            dataObj = {};
            xColumnData = columnData[allColumnNames.indexOf(xAxisColumnName)];
            yColumnData = columnData[allColumnNames.indexOf(yColName)];

            // Get trace type
            if (colsWithTraceTypes.includes(yColName)) {
                traceType = columnTraceTypes[yColName];
            }

            const dataTemplate = {
                name: yColName,
                type: traceType,
                mode: traceType === 'line' || traceType === 'area' ? 'lines' : 'markers',
                fill: traceType === 'area' ? 'tozeroy' : null,                                       
            };

            dataObj = {x: xColumnData, y: yColumnData, marker: {color: traceColor}};

            if (traceType === 'scattergeo-usa' || traceType === 'scattergeo-world') {
                delete dataObj.x;
                delete dataObj.y;
                dataObj = {
                    lat: xColumnData, 
                    lon: yColumnData,
                    type: 'scattergeo'
                };
            }
            else if (traceType === 'choropleth-usa') {
                delete dataObj.x;
                delete dataObj.y;
                dataObj = {
                    locations: xColumnData, 
                    z: yColumnData,
                    type: 'choropleth',
                    colorscale: [[0, 'rgb(242,240,247)'], [0.2, 'rgb(218,218,235)'],
                        [0.4, 'rgb(188,189,220)'], [0.6, 'rgb(158,154,200)'],
                        [0.8, 'rgb(117,107,177)'], [1, 'rgb(84,39,143)']]
                };   
            }
            else if (traceType === 'choropleth-world') { 
                delete dataObj.x;
                delete dataObj.y;
                dataObj = {
                    locations: xColumnData, 
                    z: yColumnData,
                    type: 'choropleth',
                    locationmode: 'USA-states',
                    colorscale: [[0,'rgb(5, 10, 172)'],[0.35,'rgb(40, 60, 190)'],
                        [0.5,'rgb(70, 100, 245)'], [0.6,'rgb(90, 120, 245)'],
                        [0.7,'rgb(106, 137, 247)'],[1,'rgb(220, 220, 220)']]
                };   
            }                       
            else if (traceType === 'pie') {
                delete dataObj.x;
                delete dataObj.y;
                delete dataObj.marker.color
                let pieColors = [];
                Array(100).fill().map(i => pieColors = pieColors.concat(DEFAULT_COLORS));
                dataObj = {
                    values: xColumnData, 
                    labels: yColumnData,
                    marker: {colors: pieColors},
                    hole: 0.2,
                    pull: 0.05
                };
            }

            data.push(Object.assign(dataObj, dataTemplate));
        });

        layout['xaxis'] = {};
        layout['yaxis'] = {};
        layout['title'] = ' ';
        layout['xaxis']['title'] = xAxisColumnName;
        layout['xaxis']['zeroline'] = false;
        layout['yaxis']['zeroline'] = false;
        layout['xaxis']['showgrid'] = false;
        layout['barmode'] = 'stack';
        layout['yaxis']['title'] = ' ';
        layout['yaxis']['gridcolor'] = '#dfe8f3';
        layout['font'] = {color: '#506784', size: '12px'};  
        if (allColumnNames.length === 2) {
            layout['yaxis'] = {};
            layout['yaxis']['title'] = yColName;
        }

        if (data.length) {
            if (data[0].type === 'pie') {
                layout['yaxis']['showgrid'] = false;
                layout['yaxis']['showticklabels'] = false;
                layout['xaxis']['showticklabels'] = false;
                layout['xaxis']['title'] = ' ';
            }
        }

        if (traceType === 'choropleth-us' || traceType === 'scattergeo-usa') {
            layout['geo'] = {};
            layout['geo']['scope'] = 'usa';
        }
    }

    return {data: data, layout: layout}
}