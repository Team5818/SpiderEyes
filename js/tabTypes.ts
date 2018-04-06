import {CsvData} from "./csvData";

export enum TabType {
    CSV, AVG
}

export class TabBase {
    id: string;
    type: TabType;

    constructor(id: string, type: TabType) {
        this.id = id;
        this.type = type;
    }
}

const nextId = Object.assign(function () {
    return (nextId.counter++).toString(36);
}, {counter: 0});

export class CsvTabProps extends TabBase {
    data: CsvData;

    constructor(data: CsvData) {
        super(nextId(), TabType.CSV);
        this.data = data;
    }
}

export class AvgTabProps extends TabBase {
    data: CsvData;

    constructor(data: CsvData) {
        super(nextId(), TabType.AVG);
        this.data = data;
    }
}

export type TabProps = CsvTabProps | AvgTabProps;
