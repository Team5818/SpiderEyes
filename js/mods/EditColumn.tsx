import {CsvColumn} from "../csv/CsvData";
import {FormGroup, Input, Label} from "reactstrap";
import React, {useRef, useState} from "react";
import {CsvModal} from "../csv/CsvModal";

export type EditColumnProps = {
    column: CsvColumn,
    onEditFinish: (column: CsvColumn) => void
};

export const EditColumn: React.FunctionComponent<EditColumnProps> = ({column, onEditFinish}) => {
    const [score, setScore] = useState(column.score);
    const currentCol = useRef(column);

    return <CsvModal title="Edit Column"
                     submitLabel="Finish"
                     onSubmit={() => onEditFinish(currentCol.current)}>
        <div>
            <FormGroup inline>
                <Label>
                    Score:
                    <Input placeholder="Score"
                           type="number"
                           aria-label="Score"
                           value={score}
                           onChange={e => {
                               const score = e.currentTarget.valueAsNumber;
                               setScore(score);
                               currentCol.current = currentCol.current.with({score: score});
                           }}/>
                </Label>
            </FormGroup>
        </div>
    </CsvModal>;
};
