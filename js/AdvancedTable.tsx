import React, {MouseEvent} from "react";
import {Col, Row} from 'reactstrap';
import {compareValue, CsvValue, stringifyValue} from "./values";
import {SortDirection} from "./SortDirection";
import {SortArrows} from "./SortArrows";

export type AdvancedTableProps = {
    header: string[],
    values: CsvValue[][]
}

type AdvancedTableState = {
    sortIndex: number,
    sortDirection: SortDirection
}

export class AdvancedTable extends React.Component<AdvancedTableProps, AdvancedTableState> {
    constructor(props: AdvancedTableProps) {
        super(props);
        this.state = {
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

    render() {
        const resortedValues = this.props.values.slice();
        const sortIdx = this.state.sortIndex;
        const sortMult = this.state.sortDirection === SortDirection.ASCENDING ? 1 : -1;
        resortedValues.sort((a, b) => {
            return sortMult * compareValue(a[sortIdx], b[sortIdx]);
        });
        return <div>
            <Row noGutters>
                {this.props.header.map((v, i) => this.tableHeader(i, v))}
            </Row>
            {resortedValues.map((valueRow, i) => {
                return <Row noGutters key={i}>
                    {valueRow.map((v, i) => {
                        return <Col key={`${i}-1`} className="border border-dim p-2">
                            {stringifyValue(v)}
                        </Col>;
                    })}
                </Row>
            })}
        </div>;
    }

    private tableHeader(i: number, v: string) {
        const headerSort = this.state.sortIndex === i
            ? this.state.sortDirection
            : undefined;
        return <Col key={`${i}-1`} className="border border-dim at-header-plain p-1">
            <div className="d-inline-flex h-100 align-items-center">
                <SortArrows direction={headerSort} onSort={d => this.resort(i, d)}>
                    <span className="bungee align-middle" style={{cursor: 'default'}}>
                        {v}
                    </span>
                </SortArrows>
            </div>
        </Col>;
    }
}