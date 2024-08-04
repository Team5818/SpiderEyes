import {SortDirection} from "./SortDirection";
import React, {MouseEventHandler, PropsWithChildren, ReactNode} from "react";
import sortArrowData from "./img/sort-arrow.svg";

type SortArrowProps = {
    sortDirection?: SortDirection,
    arrowDirection: SortDirection,
    onClick: MouseEventHandler<HTMLElement>,
    enabled: boolean
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

    setHover(hover: boolean): void {
        this.setState(prevState => {
            return {...prevState, hovered: hover};
        });
    }

    override render(): ReactNode {
        const selected = this.props.arrowDirection === this.props.sortDirection;
        const arrowKind = ((): string => {
            if (!this.props.enabled) {
                return 'disabled';
            }
            if (selected) {
                return 'selected';
            }
            if (this.state.hovered) {
                return 'hovered';
            }
            return 'plain';
        })();
        return <div
            className="px-1"
            onMouseEnter={(): void => this.setHover(true)}
            onMouseLeave={(): void => this.setHover(false)}
            onClick={(e): void => void (this.props.enabled && this.props.onClick(e))}>
            <img src={sortArrowData}
                 className={`sort-arrow-${arrowKind}`}
                 width={12}
                 height={12}
                 alt="Sort arrow"
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


export type SortArrowsProps = PropsWithChildren<{
    /**
     * Direction to highlight the arrow. If undefined, none are highlighted.
     */
    direction?: SortDirection,
    enabled: boolean,
    onSort(sortDir: SortDirection): void
}>;

function createSortArrow(dir: SortDirection, parentProps: SortArrowsProps): ReactNode {
    return <SortArrow
        enabled={parentProps.enabled}
        arrowDirection={dir}
        sortDirection={parentProps.direction}
        onClick={(e): void => {
            e.preventDefault();
            parentProps.onSort(dir);
        }}
    />;
}

export const SortArrows: React.FunctionComponent<SortArrowsProps> = function SortArrows(props) {
    return <div className="d-flex flex-column">
        {createSortArrow(SortDirection.ASCENDING, props)}
        {props.children}
        {createSortArrow(SortDirection.DESCENDING, props)}
    </div>;
};
