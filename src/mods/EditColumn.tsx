import {CsvColumn} from "../csv/CsvData";
import {Col, Form, FormGroup, Input, InputProps, Label, Row} from "reactstrap";
import React, {useRef, useState} from "react";
import {CsvModal} from "../csv/CsvModal";
import {CsvValueTypes} from "../csv/values";

export interface EditColInputProps {
    readableName: string
    idName: string
    type: InputProps['type']
    value: string | string[] | number
    onChange: React.ChangeEventHandler<HTMLInputElement>,
    children?: React.ReactNode;
}

const EditColInput: React.FunctionComponent<EditColInputProps> = (
    {readableName, idName, type, value, onChange, children}
) => {
    const inputId = `editcol-${idName}`;
    return <FormGroup row>
        <Label for={inputId} sm={2}>
            {readableName}:
        </Label>
        <Col sm={10}>
            <Input placeholder={readableName}
                   type={type}
                   aria-label={readableName}
                   id={inputId}
                   value={value}
                   onChange={onChange}>
                {children}
            </Input>
        </Col>
    </FormGroup>;
};

export interface EditColumnProps {
    column: CsvColumn
    onEditFinish: (column: CsvColumn) => void
}

export const EditColumn: React.FunctionComponent<EditColumnProps> = ({column, onEditFinish}) => {
    const [name, setName] = useState(column.name);
    const [type, setType] = useState(column.type);
    const [score, setScore] = useState(column.score);
    const currentCol = useRef(column);

    return <CsvModal title="Edit Column"
                     submitLabel="Finish"
                     onSubmit={(): void => onEditFinish(currentCol.current)}>
        <Row>
            <Form className="w-md-50 mx-auto">
                <EditColInput
                    readableName="Name"
                    idName="name"
                    type="text"
                    value={name}
                    onChange={(e): void => {
                        const name = e.currentTarget.value;
                        setName(name);
                        currentCol.current = currentCol.current.with({name: name});
                    }}
                />
                <EditColInput
                    readableName="Type"
                    idName="type"
                    type="select"
                    value={CsvValueTypes.readable(type)}
                    onChange={(e): void => {
                        const type = CsvValueTypes.fromReadable(e.currentTarget.value);
                        if (typeof type === "undefined") {
                            return;
                        }
                        setType(type);
                        currentCol.current = currentCol.current.with({type: type});
                    }}
                >
                    {CsvValueTypes.values().map(v =>
                        <option key={v} value={CsvValueTypes.readable(v)}>{CsvValueTypes.readable(v)}</option>
                    )}
                </EditColInput>
                {CsvValueTypes.isScoreCapable(currentCol.current.type) &&
                <EditColInput
                    readableName="Score"
                    idName="score"
                    type="number"
                    value={score}
                    onChange={(e): void => {
                        const score = e.currentTarget.valueAsNumber;
                        setScore(score);
                        currentCol.current = currentCol.current.with({score: score});
                    }}
                />
                }
            </Form>
        </Row>
    </CsvModal>;
};
