import React from "react";
import colorbrewer from "colorbrewer";
import {CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

export interface GraphConfiguration {
    height: number,
    data: unknown[],
    xKey: string,
    yKeys: string[],
    yAxisLabel: string,
}

export interface GraphProps {
    graphConfig: GraphConfiguration
}

export const Graph: React.FunctionComponent<GraphProps> = (props) => {
    const graphConfig = props.graphConfig;
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--bs-white');
    return <ResponsiveContainer width="100%" height={graphConfig.height}>
        <LineChart data={graphConfig.data}>
            <XAxis
                label={{
                    value: graphConfig.xKey, position: 'insideBottom', style: {fill: textColor}, offset: -10
                }}
                dataKey={graphConfig.xKey}
            />
            <YAxis label={{value: graphConfig.yAxisLabel, angle: -90, position: 'insideLeft', style: {fill: textColor}}}
            />
            <CartesianGrid stroke="#ccc"/>
            <Tooltip/>
            <Legend align="right"/>
            {graphConfig.yKeys.map((key, index) => {
                const colorset = colorbrewer.Set3[12];
                const color = colorset[index % colorset.length];
                return <Line connectNulls key={key} type="linear" dataKey={key} stroke={color} strokeWidth={3}
                             dot={{fill: "black"}}/>;
            })}
        </LineChart>
    </ResponsiveContainer>;
};
