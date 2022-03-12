import {CsvData} from "../csv/CsvData";
import {Form, FormGroup, Label} from "reactstrap";
import React, {Dispatch, SetStateAction, useMemo, useState} from "react";
import {HeaderSelection} from "../HeaderSelection";
import {CsvModal} from "../csv/CsvModal";
import {GraphConfiguration} from "../Graph";
import {addAndSelectTab} from "../reduxish/store";
import {GraphTabProps} from "../tabTypes";
import {Average, averageIsInstance, CsvValueSealed, CsvValueType, CsvValueTypes, stringifyValue} from "../csv/values";
import {noUnhandledCase} from "../utils";
import {MultiSelect} from "../MultiSelect";
import {SortDirection} from "../SortDirection";

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
    };
}

function mapForGraph(v: CsvValueSealed): C3Value {
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

type C3Value = string | number | boolean;

function degrade(value: CsvValueSealed['value']): C3Value {
    if (averageIsInstance(value)) {
        return value.average;
    }
    return value;
}

export const MakeGraph: React.FunctionComponent<MakeGraphProps> = ({data}) => {
    const dataSet = toHeaderSelect(useState(new Array(data.header.length)));
    const [dataSetKeys, setDataSetKeys] = useState(new Set<CsvValueSealed>());
    const xAxis = toHeaderSelect(useState(new Array(data.header.length)));
    const yAxis = toHeaderSelect(useState(new Array(data.header.length)));
    const dataSetSelected = dataSet.get.indexOf(true) >= 0;

    function updateSelected(index: number, value: boolean, state: HeaderSelectState): void {
        state.set((old) => {
            const newState = old.slice();
            newState[index] = value;
            return newState;
        });
    }

    function updateSelectedKey(index: CsvValueSealed, value: boolean): void {
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

    function HSMG({state}: { state: HeaderSelectState }): ReturnType<React.FC> {
        return <HeaderSelection header={data.columnNames}
                                selected={state.get}
                                setSelected={(i, v): void => updateSelected(i, v, state)}
                                max={1}/>;
    }

    const allDataSetKeys = useMemo(() => dataSetSelected
        ? ((): CsvValueSealed[] => {
            const dataSetIndex = selected(dataSet);
            const stringyUnique = new Set<string>();
            const keys = new Array<CsvValueSealed>();
            for (const key of data.values.map(row => row.data[dataSetIndex]!)) {
                const asString = stringifyValue(key);
                if (stringyUnique.has(asString)) {
                    continue;
                }
                stringyUnique.add(asString);
                keys.push(key);
            }
            const sortHelp = data.header[dataSetIndex]!.sortingHelper;
            return keys.filter(k => sortHelp.isGoodValue(k.value))
                .sort((a, b) => sortHelp.compare(a.value, b.value));
        })()
        : [], [data.values, data.header, dataSetSelected, dataSet]);

    async function createTab(): Promise<void> {
        const dataSetIndex = selected(dataSet);
        const xAxisIndex = selected(xAxis);
        const yAxisIndex = selected(yAxis);
        if (dataSetIndex === -1 || xAxisIndex === -1 || yAxisIndex === -1) {
            return;
        }

        const xAxisName = data.columnNames[xAxisIndex]!;
        const yAxisName = data.columnNames[yAxisIndex]!;

        // We spread the values of each graph along the missing X values
        // Essentially we say they stay the same where no data is present.

        const sortedByX = await data.sort({key: xAxisIndex, direction: SortDirection.ASCENDING});
        const xValues = Array.from(new Set(sortedByX.values.map(row => mapForGraph(row.data[xAxisIndex]!))));
        const columnData = new Array<[string, ...C3Value[]]>();
        columnData.push([xAxisName, ...xValues]);
        for (const key of dataSetKeys) {
            const defaultValue = degrade(CsvValueTypes.defaultValue(data.header[yAxisIndex]!.type));
            const col = new Array<C3Value>();
            col.push(defaultValue);
            let lastXValue: C3Value | Average | undefined = undefined;
            for (const row of sortedByX.values.map(r => r.data)) {
                if (row[dataSetIndex]!.value === key.value) {
                    // matching row -- new value!
                    col.push(degrade(row[yAxisIndex]!.value));
                } else {
                    const xValue = row[xAxisIndex]!.value;
                    if (lastXValue === xValue) {
                        continue;
                    }
                    lastXValue = xValue;
                    // re-use last row
                    col.push(col[col.length - 1]!);
                }
            }
            // pop the original default value.
            col.splice(0, 1);
            columnData.push([stringifyValue(key), ...col]);
        }

        const graphConfig: GraphConfiguration = {
            chart: {
                data: {
                    x: xAxisName,
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

    return <CsvModal title="Make Graph" submitLabel="Graph It!"
                     onSubmit={(): void => void createTab().catch(err => {
                         console.error("Error creating graph tab", err);
                     })}>
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
                    select={(i, v): void => updateSelectedKey(i, v)}
                    valueToString={stringifyValue}
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
