import React, {useState} from "react";
import {Container, Table} from "reactstrap";

/**
 * Given a type S, extract all keys that map to boolean arrays.
 */
export type BoolArrayKey<S> = {
    [K in keyof S]: S[K] extends boolean[] ? K : never;
}[keyof S];

export type HeaderSelectionProps = {
    header: string[],
    selected: boolean[],
    setSelected(index: number, selected: boolean): void,
    max?: number
};

export const HeaderSelection: React.FunctionComponent<HeaderSelectionProps> = (
    {header, selected, setSelected, max}
) => {
    const [hovered, setHovered] = useState(-1);
    const maxSelectable = typeof max === "undefined" ? header.length : max;

    function toggle(index: number): void {
        if (selected.reduce((acc, next) => acc + (next ? 1 : 0), 0) >= maxSelectable) {
            if (!selected[index]) {
                // unselect one
                setSelected(selected.indexOf(true), false);
            }
        }
        setSelected(index, !selected[index]);
    }

    return <Container>
        <Table>
            <thead>
            <tr>
                {header.map((v, i) => {
                    const bgColor = selected[i]
                        ? 'bg-primary'
                        : hovered === i
                            ? 'bg-secondary'
                            : '';
                    return <th key={i}
                               className={[
                                   'border',
                                   'border-dim',
                                   'align-middle',
                                   'p-1',
                                   bgColor
                               ].join(' ')}
                               style={{
                                   cursor: 'pointer'
                               }}
                               onMouseEnter={(): void => setHovered(i)}
                               onMouseLeave={(): void => setHovered(-1)}
                               onClick={(e): void => {
                                   e.preventDefault();
                                   toggle(i);
                               }}>
                        <div className="d-inline-flex h-100 align-items-center">
                            <div className="d-flex flex-column">
                                {v}
                            </div>
                        </div>
                    </th>;
                })}
            </tr>
            </thead>
        </Table>
    </Container>;
};
