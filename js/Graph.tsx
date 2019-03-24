import React, {useEffect, useRef, useState} from "react";
import c3 from "c3";
import colorbrewer from "colorbrewer";
import ReactResizeDetector from "react-resize-detector";

export interface GraphConfiguration {
    chart: c3.ChartConfiguration
}

export interface GraphProps {
    graphConfig: GraphConfiguration
}

export const Graph: React.FunctionComponent<GraphProps> = (props) => {
    const graphElement = useRef<any>(null);
    const [size, setSize] = useState({width: 0, height: 0});
    useEffect(() => {
        const element = graphElement.current;
        if (element !== null) {
            c3.generate({
                ...props.graphConfig.chart,
                bindto: element as HTMLElement,
                size: size,
                color: {
                    pattern: colorbrewer.Set1["9"]
                }
            });
        }
    }, [graphElement.current, size]);
    return <ReactResizeDetector handleHeight refreshMode={"throttle"} refreshRate={100}
                                onResize={(w, h) => setSize({width: w, height: h})}>
        <div className="graph w-100 h-100">
            <div ref={graphElement}/>
        </div>
    </ReactResizeDetector>;
};
