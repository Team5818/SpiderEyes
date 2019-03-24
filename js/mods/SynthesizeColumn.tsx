import {CsvData, CsvRow} from "../csv/CsvData";
import {Form, FormGroup, Input, Label} from "reactstrap";
import React from "react";
import {addAndSelectTab} from "../reduxish/store";
import {CsvTabProps} from "../tabTypes";
import {BoolArrayKey, HeaderSelection} from "../HeaderSelection";
import {interpretValue, reduceValues} from "../csv/values";
import {CsvModal} from "../csv/CsvModal";


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
        newHeaders.splice(newIndex, 0,
            newHeaders[newIndex - 1].with({name: this.state.name, score: 1}));

        const newValues = this.props.data.values.map(row => {
            const newRow = row.data.slice();
            const value = row.data
                .map((v, i) => ({value: v, score: this.props.data.header[i].score}))
                .filter((v, i) => this.state.selectedHeaders[i])
                .reduce((prev, next) => reduceValues(prev, next.value, next.score), 0);
            newRow.splice(newIndex, 0, interpretValue(value));
            return newRow;
        });

        addAndSelectTab(new CsvTabProps(new CsvData(newHeaders, newValues.map((v, i) => new CsvRow(v, i)))));
    }

    private updateSelected(
        index: number,
        value: boolean,
        key: BoolArrayKey<SynthesizeColumnState>
    ) {
        this.setState((prevState) => {
            const newState = prevState[key].slice();
            newState[index] = value;
            return {
                ...prevState,
                [key]: newState
            };
        });
    }

    render() {
        return <CsvModal title="Synthesize Column" submitLabel="Synthesize" onSubmit={() => this.createTab()}>
            <Form>
                <FormGroup>
                    <Label className="w-100">
                        Select Columns
                    </Label>
                    <HeaderSelection header={this.props.data.columnNames}
                                     selected={this.state.selectedHeaders}
                                     setSelected={(i, v) => this.updateSelected(i, v, 'selectedHeaders')}/>
                </FormGroup>
                <FormGroup>
                    <Input className="w-25 m-auto"
                           placeholder="Name"
                           type="text"
                           aria-label="Name"
                           value={this.state.name}
                           onChange={e => this.updateName(e.currentTarget.value)}/>
                </FormGroup>
            </Form>
        </CsvModal>;
    }
}
