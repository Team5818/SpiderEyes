import React, {useState} from "react";

export interface MultiSelectProps<T> {
    options: T[]
    selected: boolean[]

    select(item: T, selected: boolean): void

    toString?: (v: T) => string
}

export const MultiSelect: React.FunctionComponent<MultiSelectProps<any>> = (
    {options, selected, select, toString}
) => {
    const [hovered, setHovered] = useState(-1);
    const realToString: (v: any) => string = typeof toString === "undefined" ? (x => `${x}`) : toString;

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
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(-1)}
                        onClick={e => {
                            e.preventDefault();
                            select(v, !selected[i])
                        }}>
                <div className="d-inline-flex h-100 align-items-center">
                    <div className="d-flex flex-column">
                        {asString}
                    </div>
                </div>
            </div>;
        })}
    </div>
};