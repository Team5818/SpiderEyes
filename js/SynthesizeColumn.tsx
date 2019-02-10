import {CsvColumn, CsvData} from "./csv/CsvData";
import {FormGroup, Input, Label} from "reactstrap";
import React from "react";
import {addAndSelectTab} from "./reduxish/store";
import {CsvTabProps} from "./tabTypes";
import {HeaderSelection} from "./HeaderSelection";
import {interpretValue, reduceValues} from "./csv/values";
import {CsvModal} from "./csv/CsvModal";


export type SynthesizeColumnProps = {
    data: CsvData
};
type SynthesizeColumnState = {
    selectedHeaders: boolean[],
    name: string
};

export class SynthesizeColumn extends React.Component<SynthesizeColumnProps, SynthesizeColumnState> {
    constructor(props: SynthesizeColumnProps) {
        super(props);
        this.state = {
            selectedHeaders: new Array(props.data.header.length),
            name: ''
        }
    }

    updateName(name: string) {
        this.setState(prevState => {
            return {
                ...prevState,
                name: name
            }
        })
    }

    get lastSelectedIndex() {
        return this.state.selectedHeaders.lastIndexOf(true);
    }

    createTab() {
        // Insert new col after last selected item
        const newIndex = this.lastSelectedIndex + 1;

        const newHeaders = this.props.data.header.slice();
        newHeaders.splice(newIndex, 0, newHeaders[newIndex - 1].withName(this.state.name));

        const newValues = this.props.data.values.map(row => {
            const newRow = row.slice();
            const value = row
                .filter((v, i) => this.state.selectedHeaders[i])
                .reduce(reduceValues, 0);
            newRow.splice(newIndex, 0, interpretValue(value));
            return newRow;
        });

        addAndSelectTab(new CsvTabProps(new CsvData(newHeaders, newValues)));
    }

    render() {
        return <CsvModal title="Synthesize Column" submitLabel="Synthesize" onSubmit={() => this.createTab()}>
            <div>
                <FormGroup>
                    <Label className="w-100">
                        Select Columns
                        <HeaderSelection header={this.props.data.columnNames} selected={this.state.selectedHeaders}/>
                    </Label>
                </FormGroup>
                <FormGroup>
                    <Input className="w-25 m-auto"
                           placeholder="Name"
                           type="text"
                           aria-label="Name"
                           value={this.state.name}
                           onChange={e => this.updateName(e.currentTarget.value)}/>
                </FormGroup>
            </div>
        </CsvModal>;
    }
}
