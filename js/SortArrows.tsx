import {SortDirection} from "./SortDirection";
import React, {MouseEventHandler} from "react";

type SortArrowProps = {
    sortDirection?: SortDirection,
    arrowDirection: SortDirection,
    onClick: MouseEventHandler<HTMLElement>
}

type SortArrowState = {
    hovered: boolean
}

class SortArrow extends React.Component<SortArrowProps, SortArrowState> {
    constructor(props: SortArrowProps) {
        super(props);
        this.state = {
            hovered: false
        };
    }

    setHover(hover: boolean) {
        this.setState(prevState => {
            return {...prevState, hovered: hover};
        })
    }

    render() {
        const selected = this.props.arrowDirection === this.props.sortDirection;
        const arrowKind = selected
            ? 'selected'
            : this.state.hovered
                ? 'hovered'
                : 'plain';
        return <div
            className="px-1"
            onMouseEnter={() => this.setHover(true)}
            onMouseLeave={() => this.setHover(false)}
            onClick={this.props.onClick}>
            <img src={`./img/sort-arrow.svg`}
                 className={`sort-arrow-${arrowKind}`}
                 width={12}
                 height={12}
                 style={
                     this.props.arrowDirection === SortDirection.ASCENDING
                         ? {}
                         : {
                             transform: "scaleY(-1)"
                         }
                 }/>
        </div>;
    }
}


export type SortArrowsProps = {
    /**
     * Direction to highlight the arrow. If undefined, none are highlighted.
     */
    direction?: SortDirection,
    onSort(sortDir: SortDirection): void
};

function createSortArrow(dir: SortDirection, parentProps: SortArrowsProps) {
    return <SortArrow
        arrowDirection={dir}
        sortDirection={parentProps.direction}
        onClick={e => {
            e.preventDefault();
            parentProps.onSort(dir);
        }}
    />;
}

export const SortArrows: React.StatelessComponent<SortArrowsProps> = function SortArrows(props) {
    return <div className="d-flex flex-column">
        {createSortArrow(SortDirection.ASCENDING, props)}
        {props.children}
        {createSortArrow(SortDirection.DESCENDING, props)}
    </div>;
};
