import {CsvData} from "./csvData";
import {FormGroup, Label} from "reactstrap";
import React from "react";
import {addAndSelectTab} from "./reduxish/store";
import {AvgTabProps, CsvTabProps} from "./tabTypes";
import {HeaderSelection} from "./HeaderSelection";
import {averageRows, CsvValue, CsvValueSealed, genAverageRowArray, interpretValue} from "./values";
import {CsvModal} from "./CsvModal";


export type AverageValuesProps = {
    data: CsvData
};
type AverageValuesState = {
    selectedKeyHeaders: boolean[],
    selectedValueHeaders: boolean[]
};

export class AverageValues extends React.Component<AverageValuesProps, AverageValuesState> {
    constructor(props: AverageValuesProps) {
        super(props);
        this.state = {
            selectedKeyHeaders: new Array(props.data.header.length),
            selectedValueHeaders: new Array(props.data.header.length),
        }
    }

    private isSelected(i: number) {
        return this.state.selectedValueHeaders[i] || this.state.selectedKeyHeaders[i];
    }

    createTab() {
        const keyIndex = this.state.selectedKeyHeaders.indexOf(true);
        const newHeaders = this.props.data.header.filter((v, i) => this.isSelected(i));

        const rowMap: Map<any, CsvValueSealed[][]> = new Map();
        this.props.data.values.forEach(row => {
            const key = row[keyIndex].value;
            let valueColl = rowMap.get(key);
            if (typeof valueColl === "undefined") {
                valueColl = [];
                rowMap.set(key, valueColl);
            }

            valueColl.push(row.filter((v, i) => this.state.selectedValueHeaders[i]));
        });

        const numSelectedValues = this.state.selectedValueHeaders.reduce((sum, val) => sum + (val ? 1 : 0), 0);

        const newValues = Array.from(rowMap.entries()).map(([k, v]) => {
            // Key + averaged values
            return [interpretValue(k)].concat(
                v.reduce(averageRows, genAverageRowArray(numSelectedValues)).map(a => a.value)
            );
        });

        addAndSelectTab(new AvgTabProps(new CsvData(newHeaders, newValues)));
    }

    render() {
        return <CsvModal title="Calculate Averages" submitLabel="Calculate" onSubmit={() => this.createTab()}>
            <div>
                <FormGroup>
                    <Label className="w-100">
                        Select Average Key Column (column to match to collect values)
                        <HeaderSelection header={this.props.data.columnNames} selected={this.state.selectedKeyHeaders}
                                         max={1}/>
                    </Label>
                </FormGroup>
                <FormGroup>
                    <Label className="w-100">
                        Select Average Value Columns (columns to compute averages on)
                        <HeaderSelection header={this.props.data.columnNames} selected={this.state.selectedValueHeaders}/>
                    </Label>
                </FormGroup>
            </div>
        </CsvModal>;
    }
}
