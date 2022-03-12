import {CsvData} from "../csv/CsvData";
import {Button, Nav, NavItem} from "reactstrap";
import React from "react";
import {injectModal} from "../csv/CsvModal";
import {SynthesizeColumn} from "./SynthesizeColumn";
import {AverageValues} from "./AverageValues";
import {MakeGraph} from "./MakeGraph";

export type CsvModControllerProps = {
    data: CsvData
}

function synthesizeColumn(data: CsvData): void {
    injectModal(<SynthesizeColumn data={data}/>);
}

function calculateAverages(data: CsvData): void {
    injectModal(<AverageValues data={data}/>);
}

function makeGraph(data: CsvData): void {
    injectModal(<MakeGraph data={data}/>);
}

export const CsvModController: React.FunctionComponent<CsvModControllerProps> =
    function CsvModController(props: CsvModControllerProps) {
        return <Nav className="mb-3 justify-content-center">
            <NavItem className="mr-3">
                <Button color="primary" className="bungee" onClick={(): void => synthesizeColumn(props.data)}>
                    Synthesize Column
                </Button>
            </NavItem>
            <NavItem className="mr-3">
                <Button color="primary" className="bungee" onClick={(): void => calculateAverages(props.data)}>
                    Calculate Averages
                </Button>
            </NavItem>
            <NavItem>
                <Button color="primary" className="bungee" onClick={(): void => makeGraph(props.data)}>
                    Make Graph
                </Button>
            </NavItem>
        </Nav>;
    };
