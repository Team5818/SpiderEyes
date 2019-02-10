import {CsvData} from "./csv/CsvData";

export enum TabType {
    CSV, AVG
}

export class TabBase {
    id: string;
    type: TabType | undefined = undefined;

    constructor() {
        this.id = nextId();
    }
}

const nextId = Object.assign(function () {
    return (nextId.counter++).toString(36);
}, {counter: 0});

export class CsvTabProps extends TabBase {
    data: CsvData;
    type = TabType.CSV;

    constructor(data: CsvData) {
        super();
        this.data = data;
    }
}

export class AvgTabProps extends TabBase {
    data: CsvData;
    type = TabType.AVG;

    constructor(data: CsvData) {
        super();
        this.data = data;
    }
}

export type TabProps = CsvTabProps | AvgTabProps;
