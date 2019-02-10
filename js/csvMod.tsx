import {CsvData} from "./csvData";
import {Button, Nav, NavItem} from "reactstrap";
import React from "react";
import {injectModal} from "./CsvModal";
import {SynthesizeColumn} from "./SynthesizeColumn";
import {AverageValues} from "./AverageValues";

export type CsvModControllerProps = {
    data: CsvData
}

function synthesizeColumn(data: CsvData) {
    injectModal(<SynthesizeColumn data={data}/>);
}

function calculateAverages(data: CsvData) {
    injectModal(<AverageValues data={data}/>);
}

export const CsvModController: React.FunctionComponent<CsvModControllerProps> =
    function CsvModController(props: CsvModControllerProps) {
        return <Nav className="mb-3 justify-content-center">
            <NavItem className="mr-3">
                <Button color="primary" className="bungee" onClick={() => synthesizeColumn(props.data)}>
                    Synthesize Column
                </Button>
            </NavItem>
            <NavItem>
                <Button color="primary" className="bungee" onClick={() => calculateAverages(props.data)}>
                    Calculate Averages
                </Button>
            </NavItem>
        </Nav>
    };