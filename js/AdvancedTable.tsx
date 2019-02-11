import React from "react";
import {Col, ColProps, Row} from 'reactstrap';
import {stringifyValue} from "./csv/values";
import {SortDirection} from "./SortDirection";
import {SortArrows} from "./SortArrows";
import {CsvData} from "./csv/CsvData";
import {AutoSizer, List, ListRowRenderer, WindowScroller, CellMeasurerCache, CellMeasurer} from "react-virtualized";

type ATCloseButtonProps = {
    rowDrop: () => any
};

class ATCloseButton extends React.Component<ATCloseButtonProps, { hover: boolean }> {
    constructor(props: ATCloseButtonProps) {
        super(props);
        this.state = {
            hover: false
        };
    }

    render() {
        return (
            <div className={this.state.hover ? 'text-danger' : 'text-light'} onClick={e => {
                e.preventDefault();
                if (!confirm('Are you sure you want to delete this row?')) {
                    return;
                }
                this.props.rowDrop();
            }}
                 onMouseEnter={() => this.setState(prevState => ({...prevState, hover: true}))}
                 onMouseLeave={() => this.setState(prevState => ({...prevState, hover: false}))}>
                <i className="fas fa-times"/>
            </div>);
    }
}

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
        fixedWidth: true
    });

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

    render() {
        const resortedValues = this.state.data.sort(
            this.state.sortIndex,
            this.state.sortDirection
        );

        const rowRender: ListRowRenderer = ({key, index, style, parent}) => {
            return <CellMeasurer
                cache={this.cache}
                rowIndex={index}
                key={key}
                parent={parent}
            >
            <Row noGutters key={key} style={style}>
                {resortedValues[index].map((v, i) => {
                    return <Col key={`${i}-1`} className="border border-dim p-2">
                        {stringifyValue(v)}
                    </Col>;
                })}
                <Col className="border border-dim p-2">
                    <div className="m-auto d-inline-block">
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
                                autoHeight
                                height={height}
                                rowCount={resortedValues.length}
                                rowRenderer={rowRender}
                                rowHeight={this.cache.rowHeight}
                                deferredMeasurementCache={this.cache}
                                width={width}
                                isScrolling={isScrolling}
                                onScroll={onChildScroll}
                                scrollTop={scrollTop}
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
        const colProps: Pick<ColProps, 'className' | 'key'> = {
            className: 'border border-dim at-header-plain p-1'
        };
        if (typeof i !== "undefined") {
            colProps.key = `${i}-1`;
        }
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