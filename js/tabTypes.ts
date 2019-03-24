import {CsvData} from "./csv/CsvData";
import {GraphConfiguration} from "./Graph";

export enum TabType {
    CSV, AVG, GRAPH
}

export class TabBase {
    readonly id: string;
    readonly type: TabType | undefined = undefined;

    constructor() {
        this.id = nextId();
    }
}

const nextId = Object.assign(function () {
    return (nextId.counter++).toString(36);
}, {counter: 0});

export class CsvTabProps extends TabBase {
    readonly data: CsvData;
    readonly type = TabType.CSV;

    constructor(data: CsvData) {
        super();
        this.data = data;
    }
}

export class AvgTabProps extends TabBase {
    readonly data: CsvData;
    readonly type = TabType.AVG;

    constructor(data: CsvData) {
        super();
        this.data = data;
    }
}

export class GraphTabProps extends TabBase {
    readonly graphConfig: GraphConfiguration;
    readonly type = TabType.GRAPH;

    constructor(graphConfig: GraphConfiguration) {
        super();
        this.graphConfig = graphConfig;
    }
}

export type TabProps = CsvTabProps | AvgTabProps | GraphTabProps;
