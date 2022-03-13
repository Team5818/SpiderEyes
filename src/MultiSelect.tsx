import React, {useState} from "react";
import {CsvValueSealed} from "./csv/values.js";

export interface MultiSelectProps<T> {
    options: T[]
    selected: boolean[]

    select(item: T, selected: boolean): void

    valueToString?: (v: T) => string
}

export const MultiSelect: React.FunctionComponent<MultiSelectProps<CsvValueSealed>> = (
    {options, selected, select, valueToString}
) => {
    const [hovered, setHovered] = useState(-1);
    const realToString: (v: CsvValueSealed) => string = typeof valueToString === "undefined"
        ? ((x): string => `${x}`)
        : valueToString;

    return <div className="d-flex flex-wrap">
        {options.map((v, i) => {
            const asString = realToString(v);

            const bgColor = selected[i]
                ? 'bg-primary'
                : hovered === i
                    ? 'bg-secondary'
                    : '';
            return <div key={asString + i}
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
                            select(v, !selected[i]);
                        }}>
                <div className="d-inline-flex h-100 align-items-center">
                    <div className="d-flex flex-column">
                        {asString}
                    </div>
                </div>
            </div>;
        })}
    </div>;
};
