import React, {useState} from "react";
import {Col, ColProps, Row} from 'reactstrap';
import {CsvValueType, stringifyValue} from "./csv/values";
import {SortDirection} from "./SortDirection";
import {SortArrows} from "./SortArrows";
import {CsvData} from "./csv/CsvData";
import {AutoSizer, CellMeasurer, CellMeasurerCache, List, ListRowRenderer, WindowScroller} from "react-virtualized";

type ATCloseButtonProps = {
    rowDrop: () => any
};

const ATCloseButton: React.FunctionComponent<ATCloseButtonProps> = ({rowDrop}) => {
    const [hover, setHover] = useState(false);
    return <div
        className={`p-2 h-100 d-flex flex-column justify-content-center ${hover ? 'bg-danger-like' : ''}`}
        onClick={e => {
            e.preventDefault();
            if (!confirm('Are you sure you want to delete this row?')) {
                return;
            }
            rowDrop();
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}>
        <div className={hover ? 'text-danger' : 'text-dark'}>
            <i className="fas fa-times"/>
        </div>
    </div>;
};

export type AdvancedTableProps = {
    originalData: CsvData
}

type AdvancedTableState = {
    data: CsvData
    sortIndex: number,
    sortDirection: SortDirection
}

export class AdvancedTable extends React.Component<AdvancedTableProps, AdvancedTableState> {
    private readonly cache = new CellMeasurerCache({
        defaultHeight: 20,
        minHeight: 20,
        fixedWidth: true,
        keyMapper: (row) => {
            this.state.data.values[row].map(v => v.value)
        }
    });
    private readonly bindRef = (ref: List) => this.innerList = ref;
    private innerList: List | undefined;

    constructor(props: AdvancedTableProps) {
        super(props);
        this.state = {
            data: props.originalData,
            sortIndex: 0,
            sortDirection: SortDirection.ASCENDING
        };
    }

    resort(index: number, direction: SortDirection) {
        this.setState(prevState => {
            return {
                ...prevState,
                data: prevState.data.sort(index, direction),
                sortIndex: index,
                sortDirection: direction
            };
        })
    }

    dropRow(row: number) {
        this.setState(prevState => {
            return {
                ...prevState,
                data: prevState.data.removeRow(row)
            }
        });
    }

    componentDidUpdate() {
        if (this.innerList) {
            this.cache.clearAll();
            this.innerList.forceUpdateGrid();
            this.innerList.recomputeRowHeights();
        }
    }

    render() {
        const values = this.state.data.values;

        const rowRender: (width: number) => ListRowRenderer = (width) => ({key, index, style, parent}) => {
            return <CellMeasurer
                cache={this.cache}
                columnIndex={0}
                rowIndex={index}
                key={key}
                parent={parent}
            >
                <Row noGutters key={key} style={{...style, width: width}}>
                    {values[index].map((v, i) => {
                        const extraClasses = new Array<string>();
                        if (this.state.data.header[i].sortingHelper.type == CsvValueType.STRING) {
                            // grant it extra grow
                            extraClasses.push("flex-grow-at-string")
                        }
                        return <Col key={`${i}-1`} className={"border border-dim p-2 " + extraClasses.join(' ')}>
                            {stringifyValue(v)}
                        </Col>;
                    })}
                    <Col className="border border-dim flex-shrink-1 flex-grow-0">
                        <div className="m-auto h-100 d-inline-block">
                            <ATCloseButton rowDrop={() => this.dropRow(index)}/>
                        </div>
                    </Col>
                </Row>
            </CellMeasurer>;
        };

        return <div className="d-flex h-100 flex-column">
            <Row noGutters>
                {this.state.data.columnNames.map((v, i) => this.tableHeader(i, v))}
                {this.tableHeader(undefined, <i className="fas fa-times"/>)}
            </Row>
            <div className="flex-grow-1">
                <WindowScroller>
                    {({height, isScrolling, onChildScroll, scrollTop}) => <AutoSizer disableHeight={true}>
                        {({width}) =>
                            <List
                                ref={this.bindRef}
                                autoHeight
                                height={height}
                                rowCount={values.length}
                                rowRenderer={rowRender(width)}
                                rowHeight={this.cache.rowHeight}
                                deferredMeasurementCache={this.cache}
                                width={width}
                                isScrolling={isScrolling}
                                onScroll={onChildScroll}
                                scrollTop={scrollTop}
                                overscanRowCount={30}
                            />
                        }
                    </AutoSizer>}
                </WindowScroller>
            </div>
        </div>;
    }

    private tableHeader(i: number | undefined, v: React.ReactChild) {
        const headerSort = this.state.sortIndex === i
            ? this.state.sortDirection
            : undefined;
        const classNames: string[] = ['border', 'border-dim', 'at-header-plain', 'py-1', 'px-2'];
        const colProps: Pick<ColProps, 'className' | 'key'> = {
        };
        if (typeof i !== "undefined") {
            colProps.key = `${i}-1`;
            if (this.state.data.header[i].sortingHelper.type == CsvValueType.STRING) {
                // grant it extra grow
                classNames.push('flex-grow-at-string');
            }
        } else {
            colProps.key = `x-marks-the-spot`;
            classNames.push('flex-shrink-1', 'flex-grow-0');
        }
        colProps.className = classNames.join(' ');
        const innerElement = (
            <span className="bungee align-middle" style={{cursor: 'default'}}>
                {v}
            </span>
        );
        return <Col {...colProps}>
            <div className="d-inline-flex h-100 align-items-center">
                {typeof i === "undefined"
                    ? innerElement
                    : <SortArrows direction={headerSort} onSort={d => this.resort(i, d)}>
                        {innerElement}
                    </SortArrows>
                }
            </div>
        </Col>;
    }
}