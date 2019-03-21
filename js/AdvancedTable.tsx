import React, {HTMLProps, useState} from "react";
import {Table} from 'reactstrap';
import {stringifyValue} from "./csv/values";
import {SortDirection} from "./SortDirection";
import {SortArrows} from "./SortArrows";
import {CsvData, CsvRow} from "./csv/CsvData";

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
    data: CsvData,
    sorting: boolean,
    sortIndex: number,
    sortDirection: SortDirection
}

export class AdvancedTable extends React.Component<AdvancedTableProps, AdvancedTableState> {
    constructor(props: AdvancedTableProps) {
        super(props);
        this.state = {
            data: props.originalData,
            sorting: false,
            sortIndex: 0,
            sortDirection: SortDirection.ASCENDING
        };
    }

    resort(index: number, direction: SortDirection) {
        if (this.state.sorting) {
            return;
        }
        this.setState(prevState => {
            this.state.data.sort(index, direction)
                .then(data => this.setState(prevState => {
                    return {
                        ...prevState,
                        data: data,
                        sorting: false,
                        sortIndex: index,
                        sortDirection: direction
                    };
                }));
            return {
                ...prevState,
                sorting: true
            };
        });
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
        const values = this.state.data.values;

        return <Table size="sm" bordered className="border-dim w-auto mx-auto">
            <thead>
            <tr>
                {this.state.data.columnNames.map((v, i) => this.tableHeader(i, v))}
                {this.tableHeader(undefined, <i className="fas fa-times"/>)}
            </tr>
            </thead>
            <tbody>
                {values.map((r, i) => this.renderRow(r, i))}
            </tbody>
        </Table>;
    }

    private renderRow(row: CsvRow, index: number) {
        return <tr key={`row-${row.originalIndex}`}>
            {row.data.map((v, i) => {
                const extraClasses = new Array<string>();
                return <td key={`data-${i}`} className={"p-2 " + extraClasses.join(' ')}>
                    {stringifyValue(v)}
                </td>;
            })}
            <td className="flex-shrink-1 flex-grow-0">
                <div className="m-auto h-100 d-inline-block">
                    <ATCloseButton rowDrop={() => this.dropRow(index)}/>
                </div>
            </td>
        </tr>;
    }

    private tableHeader(i: number | undefined, v: React.ReactChild) {
        const headerSort = this.state.sortIndex === i
            ? this.state.sortDirection
            : undefined;
        const classNames: string[] = ['at-header-plain', 'py-1', 'px-2'];
        const thProps: Pick<HTMLProps<HTMLTableHeaderCellElement>, 'className' | 'key' | 'style'> = {};
        if (typeof i !== "undefined") {
            thProps.key = `${i}-header`;
            thProps.style = {
                width: this.state.data.header[i].maxCharWidth + "ch"
            };
        } else {
            thProps.key = `x-marks-the-spot`;
            thProps.style = {
                width: 1
            }
        }
        thProps.className = classNames.join(' ');
        const innerElement = (
            <span className="align-middle" style={{cursor: 'default'}}>
                {v}
            </span>
        );
        return <th {...thProps}>
            <div className="d-inline-flex h-100 align-items-center">
                {typeof i === "undefined"
                    ? innerElement
                    : <SortArrows enabled={!this.state.sorting} direction={headerSort} onSort={d => this.resort(i, d)}>
                        {innerElement}
                    </SortArrows>
                }
            </div>
        </th>;
    }
}