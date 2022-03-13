import {CsvData} from "../csv/CsvData";
import {Form, FormGroup, Label} from "reactstrap";
import React, {Dispatch, SetStateAction, useMemo, useState} from "react";
import {HeaderSelection} from "../HeaderSelection";
import {CsvModal} from "../csv/CsvModal";
import {GraphConfiguration} from "../Graph";
import {addAndSelectTab} from "../reduxish/store";
import {GraphTabProps} from "../tabTypes";
import {Average, averageIsInstance, CsvValueSealed, stringifyValue} from "../csv/values";
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

type CsvValueNoAverage = Exclude<CsvValueSealed['value'], Average>;

function degrade(value: CsvValueSealed['value']): CsvValueNoAverage {
    if (averageIsInstance(value)) {
        return value.average;
    }
    return value;
}

function degradeToTypeKey(value: CsvValueSealed['value']): string | number {
    if (averageIsInstance(value)) {
        return value.average;
    }
    if (typeof value === 'boolean') {
        return `${value}`;
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

        const columnNames = data.columnNames;
        const xAxisName = columnNames[xAxisIndex]!;
        const yAxisName = columnNames[yAxisIndex]!;

        const sortedByX = await data.sort({key: xAxisIndex, direction: SortDirection.ASCENDING});
        // Contains our x axis key, and the y value for each line
        const graphData: Record<string | number, CsvValueNoAverage>[] = [];
        let lastXAxisValue: CsvValueNoAverage | undefined = undefined;
        for (const row of sortedByX.values) {
            const degradedXAxisValue = degrade(row.data[xAxisIndex]!.value);
            let xBucket: Record<string | number, CsvValueNoAverage>;
            if (degradedXAxisValue === lastXAxisValue) {
                xBucket = graphData[graphData.length - 1]!;
            } else {
                xBucket = {[xAxisName]: degradedXAxisValue};
                graphData.push(xBucket);
                lastXAxisValue = degradedXAxisValue;
            }
            xBucket[degradeToTypeKey(row.data[dataSetIndex]!.value)] = degrade(row.data[yAxisIndex]!.value);
        }

        const graphConfig: GraphConfiguration = {
            height: document.documentElement.clientHeight * 0.5,
            data: graphData,
            xKey: xAxisName,
            yKeys: Array.from(dataSetKeys).map(k => stringifyValue(k)),
            yAxisLabel: yAxisName,
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
