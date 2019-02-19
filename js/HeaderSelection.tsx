import React from "react";
import {Col, Container, Row} from "reactstrap";

export type HeaderSelectionProps = {
    header: string[],
    selected: boolean[],
    max?: number
};
type HeaderSelectionState = {
    selectionQueue: number[]
    selected: boolean[]
    hovered: boolean[]
};

export class HeaderSelection extends React.Component<HeaderSelectionProps, HeaderSelectionState> {
    constructor(props: HeaderSelectionProps) {
        super(props);
        this.state = {
            selectionQueue: [],
            selected: props.selected.slice(),
            hovered: new Array(props.selected.length)
        }
    }

    get maxSelectable() {
        const max = this.props.max;
        return typeof max === "undefined" ? this.props.header.length : max;
    }


    toggle(i: number) {
        this.setState(prevState => {
            const selected = prevState.selected.slice();
            const selectionQueue = prevState.selectionQueue.slice();

            const setSelected = (idx: number, state: boolean) => {
                this.props.selected[idx] = state;
                selected[idx] = state;
            };

            if (selected[i]) {
                const queueIndex = selectionQueue.indexOf(i);
                // remove from queue
                selectionQueue.splice(queueIndex, 1);

                setSelected(i, false);
            } else {
                // uncheck if needed
                selectionQueue.push(i);
                if (selectionQueue.length > this.maxSelectable) {
                    const item = selectionQueue.shift();
                    if (typeof item !== "undefined") {
                        setSelected(item, false);
                    }
                }

                setSelected(i, true);
            }

            return {
                ...prevState,
                selected: selected,
                selectionQueue: selectionQueue
            }
        })
    }

    hover(i: number, hover: boolean) {
        this.setState(prevState => {
            if (hover != prevState.hovered[i]) {
                const hovered = prevState.hovered.slice();
                hovered[i] = hover;
                return {
                    ...prevState,
                    hovered: hovered
                }
            } else {
                return prevState;
            }
        })
    }

    render() {
        return <Container>
            <Row noGutters>
                {this.props.header.map((v, i) => {
                    const bgColor = this.props.selected[i]
                        ? 'bg-primary'
                        : this.state.hovered[i]
                            ? 'bg-secondary'
                            : '';
                    return <Col key={i}
                                className={[
                                    'border',
                                    'border-dim',
                                    'bungee',
                                    'align-middle',
                                    'p-1',
                                    bgColor
                                ].join(' ')}
                                style={{
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={() => this.hover(i, true)}
                                onMouseLeave={() => this.hover(i, false)}
                                onClick={e => {
                                    e.preventDefault();
                                    this.toggle(i);
                                }}>
                        {v}
                    </Col>;
                })}
            </Row>
        </Container>;
    }
}