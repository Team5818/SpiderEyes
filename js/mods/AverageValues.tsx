import {CsvData, CsvRow} from "../csv/CsvData";
import {FormGroup, Label} from "reactstrap";
import React from "react";
import {addAndSelectTab} from "../reduxish/store";
import {AvgTabProps} from "../tabTypes";
import {HeaderSelection} from "../HeaderSelection";
import {averageRows, CsvValueSealed, CsvValueType, genAverageRowArray, interpretValue} from "../csv/values";
import {CsvModal} from "../csv/CsvModal";


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

    createTab() {
        const keyIndex = this.state.selectedKeyHeaders.indexOf(true);
        const headers = this.props.data.header;
        const newHeaders = [headers[keyIndex]].concat(
            headers.filter((v, i) => this.state.selectedValueHeaders[i])
        );

        const rowMap: Map<any, CsvValueSealed[][]> = new Map();
        this.props.data.values.forEach(row => {
            const key = row.data[keyIndex].value;
            let valueColl = rowMap.get(key);
            if (typeof valueColl === "undefined") {
                valueColl = [];
                rowMap.set(key, valueColl);
            }

            valueColl.push(row.data.filter((v, i) => this.state.selectedValueHeaders[i]));
        });

        const numSelectedValues = this.state.selectedValueHeaders.reduce((sum, val) => sum + (val ? 1 : 0), 0);

        const newValues = Array.from(rowMap.entries()).map(([k, v]) => {
            // Key + averaged values
            return [interpretValue(k)].concat(
                v.reduce(averageRows, genAverageRowArray(numSelectedValues)).map(a => a.value)
            );
        });

        for (let i = 1; i < newHeaders.length; i++) {
            newHeaders[i] = newHeaders[i]
                .with({
                    type: CsvValueType.AVERAGE,
                    maxCharWidth: {compute: newValues.map(x => x[i])}
                });
        }

        addAndSelectTab(new AvgTabProps(new CsvData(newHeaders, newValues.map((v, i) => new CsvRow(v, i)))));
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
                        <HeaderSelection header={this.props.data.columnNames}
                                         selected={this.state.selectedValueHeaders}/>
                    </Label>
                </FormGroup>
            </div>
        </CsvModal>;
    }
}
