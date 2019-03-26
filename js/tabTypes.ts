import {CsvData} from "./csv/CsvData";
import {GraphConfiguration} from "./Graph";

export enum TabType {
    CSV, AVG, GRAPH
}

export class TabBase {
    readonly id: string;
    readonly type: TabType | undefined = undefined;

    constructor(id: string | undefined) {
        this.id = typeof id === "undefined" ? nextId() : id;
    }
}

const nextId = Object.assign(function () {
    return (Math.round(Math.random() * 100000)).toString(36);
}, {counter: 0});

export class CsvTabProps extends TabBase {
    readonly data: CsvData;
    readonly type = TabType.CSV;

    constructor(data: CsvData, id?: string) {
        super(id);
        this.data = data;
    }
}

export class AvgTabProps extends TabBase {
    readonly data: CsvData;
    readonly type = TabType.AVG;

    constructor(data: CsvData, id?: string) {
        super(id);
        this.data = data;
    }
}

export class GraphTabProps extends TabBase {
    readonly graphConfig: GraphConfiguration;
    readonly type = TabType.GRAPH;

    constructor(graphConfig: GraphConfiguration, id?: string) {
        super(id);
        this.graphConfig = graphConfig;
    }
}

export type TabProps = CsvTabProps | AvgTabProps | GraphTabProps;
