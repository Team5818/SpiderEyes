import {CsvData} from "../csv/CsvData";
import {Form, FormGroup, Label} from "reactstrap";
import React, {Dispatch, SetStateAction, useMemo, useState} from "react";
import {HeaderSelection} from "../HeaderSelection";
import {CsvModal} from "../csv/CsvModal";
import {GraphConfiguration} from "../Graph";
import {addAndSelectTab} from "../reduxish/store";
import {GraphTabProps} from "../tabTypes";
import {CsvValueSealed, CsvValueType, stringifyValue} from "../csv/values";
import {noUnhandledCase} from "../utils";
import {MultiSelect} from "../MultiSelect";

export interface MakeGraphProps {
    data: CsvData
}

interface HeaderSelectState {
    get: boolean[]
    set: Dispatch<SetStateAction<boolean[]>>
}

function toHeaderSelect(values: [boolean[], Dispatch<SetStateAction<boolean[]>>]): HeaderSelectState {
    return {
        get: values[0],
        set: values[1]
    }
}

function prefix<T>(name: string, array: T[]): (T | string)[] {
    return ([name] as (T | string)[]).concat(array);
}

function mapForGraph(v: CsvValueSealed) {
    switch (v.type) {
        case CsvValueType.STRING:
        case CsvValueType.INTEGER:
        case CsvValueType.FLOAT:
        case CsvValueType.BOOLEAN:
            return v.value;
        case CsvValueType.AVERAGE:
            return v.value.average;
        default:
            return noUnhandledCase(v);
    }
}

function mix(axis: string, dataSet: string): string {
    return `${axis}///${dataSet}`;
}

export const MakeGraph: React.FunctionComponent<MakeGraphProps> = ({data}) => {
    const dataSet = toHeaderSelect(useState(new Array(data.header.length)));
    const [dataSetKeys, setDataSetKeys] = useState(new Set<CsvValueSealed>());
    const xAxis = toHeaderSelect(useState(new Array(data.header.length)));
    const yAxis = toHeaderSelect(useState(new Array(data.header.length)));
    const dataSetSelected = dataSet.get.indexOf(true) >= 0;

    function updateSelected(index: number, value: boolean, state: HeaderSelectState) {
        state.set((old) => {
            const newState = old.slice();
            newState[index] = value;
            return newState;
        });
    }

    function updateSelectedKey(index: any, value: boolean) {
        setDataSetKeys((old) => {
            const newState = new Set(old);
            if (value) {
                if (newState.has(index)) {
                    return old;
                }
                newState.add(index);
            } else {
                if (!newState.has(index)) {
                    return old;
                }
                newState.delete(index);
            }
            return newState;
        });
    }

    function selected(state: HeaderSelectState): number {
        return state.get.indexOf(true);
    }

    function HSMG({state}: { state: HeaderSelectState }) {
        return <HeaderSelection header={data.columnNames}
                                selected={state.get}
                                setSelected={(i, v) => updateSelected(i, v, state)}
                                max={1}/>;
    }

    const allDataSetKeys = useMemo(() => dataSetSelected
        ? (() => {
            const dataSetIndex = selected(dataSet);
            const stringyUnique = new Set<string>();
            const keys = new Array<CsvValueSealed>();
            for (let key of data.values.map(row => row.data[dataSetIndex])) {
                const asString = stringifyValue(key);
                if (stringyUnique.has(asString)) {
                    continue;
                }
                stringyUnique.add(asString);
                keys.push(key);
            }
            const sortHelp = data.header[dataSetIndex].sortingHelper;
            return keys.filter(k => sortHelp.isGoodValue(k.value))
                .sort((a, b) => sortHelp.compare(a.value, b.value));
        })()
        : [], [dataSet.get, data.values]);

    function createTab() {
        const dataSetIndex = selected(dataSet);
        const xAxisIndex = selected(xAxis);
        const yAxisIndex = selected(yAxis);
        if (dataSetIndex === -1 || xAxisIndex === -1 || yAxisIndex === -1) {
            return;
        }

        const xAxisName = data.columnNames[xAxisIndex];
        const yAxisName = data.columnNames[yAxisIndex];

        // We have a separate X-Axis for each data set, since the X values for each
        // probably won't align (e.g. with data_set=teams,x=matches)

        const columnData = new Array<(string | number | boolean)[]>();
        for (let key of dataSetKeys) {
            const stringyKey = stringifyValue(key);
            columnData.push(prefix(
                mix(xAxisName, stringyKey),
                data.values
                    .filter(row => row.data[dataSetIndex].value === key.value)
                    .map(row => mapForGraph(row.data[xAxisIndex]))
            ));
            columnData.push(prefix(
                stringyKey,
                data.values
                    .filter(row => row.data[dataSetIndex].value === key.value)
                    .map(row => mapForGraph(row.data[yAxisIndex]))
            ));
        }

        const graphConfig: GraphConfiguration = {
            chart: {
                data: {
                    xs: Array.from(dataSetKeys)
                        .reduce((acc, next) => {
                            const s = stringifyValue(next);
                            return {...acc, [s]: mix(xAxisName, s)}
                        }, {}),
                    columns: columnData
                },
                axis: {
                    x: {
                        label: xAxisName
                    },
                    y: {
                        min: 0,
                        label: yAxisName
                    }
                },
                grid: {
                    y: {
                        show: true
                    }
                }
            }
        };
        addAndSelectTab(new GraphTabProps(graphConfig));
    }

    return <CsvModal title="Make Graph" submitLabel="Graph It!" onSubmit={createTab}>
        <Form className="w-75 mx-auto">
            <FormGroup>
                <Label className="w-100">
                    Select Data Set Column
                </Label>
                <HSMG state={dataSet}/>
            </FormGroup>
            <FormGroup>
                <Label className="w-100">
                    Select Data Set Entries
                </Label>
                <MultiSelect
                    options={allDataSetKeys}
                    selected={allDataSetKeys.map(x => dataSetKeys.has(x))}
                    select={(i, v) => updateSelectedKey(i, v)}
                    toString={stringifyValue}
                />
            </FormGroup>
            <FormGroup>
                <Label className="w-100">
                    Select X Axis Column
                </Label>
                <HSMG state={xAxis}/>
            </FormGroup>
            <FormGroup>
                <Label className="w-100">
                    Select Y Axis Column
                </Label>
                <HSMG state={yAxis}/>
            </FormGroup>
        </Form>
    </CsvModal>;
};
