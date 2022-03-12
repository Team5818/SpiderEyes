import React, {HTMLProps, ReactNode, useState} from "react";
import {Button, Table} from 'reactstrap';
import {stringifyValue} from "./csv/values";
import {SortDirection} from "./SortDirection";
import {SortArrows} from "./SortArrows";
import {CsvData, CsvRow} from "./csv/CsvData";
import {injectModal} from "./csv/CsvModal";
import {EditColumn} from "./mods/EditColumn";
import {Actions, ISTATE} from "./reduxish/store";

type ATCloseButtonProps = {
    rowDrop: () => void
};

const ATCloseButton: React.FunctionComponent<ATCloseButtonProps> = ({rowDrop}) => {
    const [hover, setHover] = useState(false);
    return <div
        className={`p-2 h-100 d-flex flex-column justify-content-center ${hover ? 'bg-danger-like' : ''}`}
        onClick={(e): void => {
            e.preventDefault();
            if (!confirm('Are you sure you want to delete this row?')) {
                return;
            }
            rowDrop();
        }}
        onMouseEnter={(): void => setHover(true)}
        onMouseLeave={(): void => setHover(false)}>
        <div className={hover ? 'text-danger' : 'text-dark'}>
            <i className="fas fa-times"/>
        </div>
    </div>;
};

export type AdvancedTableProps = {
    data: CsvData,
    tabId: string
}

type AdvancedTableState = {
    sorting: boolean
}

export class AdvancedTable extends React.Component<AdvancedTableProps, AdvancedTableState> {
    constructor(props: AdvancedTableProps) {
        super(props);
        this.state = {
            sorting: false
        };
    }

    private resort(index: number, direction: SortDirection): void {
        if (this.state.sorting) {
            return;
        }
        this.setState(prevState => {
            this.props.data.sort({key: index, direction: direction})
                .then(data => {
                    ISTATE.dispatch(Actions.updateTabData({
                        id: this.props.tabId,
                        data: data
                    }));
                    this.setState(prevState => {
                        return {
                            ...prevState,
                            sorting: false
                        };
                    });
                });
            return {
                ...prevState,
                sorting: true
            };
        });
    }

    private dropRow(row: number): void {
        ISTATE.dispatch(Actions.updateTabData({
            id: this.props.tabId,
            data: this.props.data.removeRow(row)
        }));
    }

    private editColumn(colIndex: number): void {
        injectModal(<EditColumn column={this.props.data.header[colIndex]!}
                                onEditFinish={(newCol): void => void
                                    ISTATE.dispatch(Actions.updateTabData({
                                        id: this.props.tabId,
                                        data: this.props.data.withColumn(colIndex, newCol)
                                    }))
                                }/>);
    }

    override render(): ReactNode {
        const values = this.props.data.values;

        return <Table size="sm" bordered className="border-dim w-auto mx-auto">
            <thead>
            <tr>
                {this.props.data.columnNames.map((_, i) =>
                    <th className="p-0" key={`edit-header-${i}`}>
                        <Button size="sm"
                                color="secondary"
                                className="btn-square w-100 btn-header"
                                onClick={(): void => this.editColumn(i)}>
                            Edit
                        </Button>
                    </th>
                )}
                <th className="bg-btn-header"/>
            </tr>
            <tr>
                {this.props.data.columnNames.map((v, i) => this.tableHeader(i, v))}
                {this.tableHeader(undefined, <i className="fas fa-times"/>)}
            </tr>
            </thead>
            <tbody>
            {values.map((r, i) => this.renderRow(r, i))}
            </tbody>
        </Table>;
    }

    private renderRow(row: CsvRow, index: number): ReactNode {
        return <tr key={`row-${row.originalIndex}`}>
            {row.data.map((v, i) => {
                const extraClasses = new Array<string>();
                return <td key={`data-${i}`} className={"p-2 " + extraClasses.join(' ')}>
                    {stringifyValue(v, this.props.data.header[i]!.score)}
                </td>;
            })}
            <td className="flex-shrink-1 flex-grow-0">
                <div className="m-auto h-100 d-inline-block">
                    <ATCloseButton rowDrop={(): void => this.dropRow(index)}/>
                </div>
            </td>
        </tr>;
    }

    private tableHeader(i: number | undefined, v: React.ReactChild): ReactNode {
        const headerSort = this.getHeaderSort(i);
        const classNames: string[] = ['at-header-plain', 'py-1', 'px-2'];
        const thProps: Pick<HTMLProps<HTMLTableHeaderCellElement>, 'className' | 'key' | 'style'> = {};
        if (typeof i !== "undefined") {
            thProps.key = `${i}-header`;
            thProps.style = {
                width: this.props.data.header[i]!.maxCharWidth + "ch"
            };
        } else {
            thProps.key = `x-marks-the-spot`;
            thProps.style = {
                width: 1
            };
        }
        thProps.className = classNames.join(' ');
        const innerElement = (
            <span className="align-middle" style={{cursor: 'default'}}>
                {v}
            </span>
        );
        return <th {...thProps}>
            {typeof i === "undefined"
                ? innerElement
                :
                <SortArrows enabled={!this.state.sorting} direction={headerSort}
                            onSort={(d): void => this.resort(i, d)}>
                    {innerElement}
                </SortArrows>
            }
        </th>;
    }

    private getHeaderSort(i: number | undefined): SortDirection | undefined {
        const currentSort = this.props.data.currentSort || {key: 0, direction: SortDirection.ASCENDING};
        return currentSort.key === i ? currentSort.direction : undefined;
    }
}
