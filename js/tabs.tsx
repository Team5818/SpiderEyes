import React, {useState} from "react";
import {Col, Nav, NavItem, NavLink, Row, TabContent, TabPane} from "reactstrap";
import {CsvModController} from "./mods/CsvModController";
import {AvgTabProps, CsvTabProps, GraphTabProps, TabProps, TabType} from "./tabTypes";
import {AdvancedTable} from "./AdvancedTable";
import {noUnhandledCase} from "./utils";
import {Graph} from "./Graph";


export const CsvTab: React.FunctionComponent<CsvTabProps> = function CsvTab(props) {
    return <div className="d-flex flex-column h-100">
        <div>
            <CsvModController {...props}/>
        </div>
        <div className="flex-grow-1">
            <AdvancedTable data={props.data} tabId={props.id}/>
        </div>
    </div>;
};

export const AvgTab: React.FunctionComponent<AvgTabProps> = function AvgTab(props) {
    return <AdvancedTable data={props.data} tabId={props.id}/>;
};

export const GraphTab: React.FunctionComponent<GraphTabProps> = function GraphTab(props) {
    return <Graph {...props}/>;
};

export type TabsProps = {
    tabs: TabProps[],
    selectedTab: string,
    selectTab: (i: string) => void,
    closeTab: (i: string) => void
}

type TabCloseButtonProps = {
    closeTab: () => void
}

const TabCloseButton: React.FunctionComponent<TabCloseButtonProps> = ({closeTab}) => {
    const [hover, setHover] = useState(false);
    return <div
        className={`${hover ? 'text-info' : ''}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={e => {
            e.preventDefault();
            closeTab();
        }}>
        <i className="fas fa-window-close"/>
    </div>;
};

function tabsHeader(props: TabsProps) {
    function getTabType(v: TabProps): string {
        switch (v.type) {
            case TabType.CSV:
                return 'file-alt';
            case TabType.AVG:
                return 'calculator';
            case TabType.GRAPH:
                return 'chart-line';
            default:
                return noUnhandledCase(v);
        }
    }

    return <Nav tabs className="border-primary" id="tab-holder">
        {props.tabs.map(v =>
            <NavItem key={v.id}
                     onClick={e => {
                         e.preventDefault();
                         props.selectTab(v.id);
                     }}>
                <NavLink active={v.id === props.selectedTab} className="p-0">
                    <Row noGutters>
                        <Col sm="auto" className="p-2">
                            <i className={`fas fa-3x fa-${getTabType(v)}`}/>
                        </Col>
                        <Col sm="auto" className="pr-1">
                            <TabCloseButton closeTab={() => props.closeTab(v.id)}/>
                        </Col>
                    </Row>
                </NavLink>
            </NavItem>
        )}
    </Nav>;
}

function tabsContainer(props: TabsProps) {
    function getElement(v: TabProps) {
        switch (v.type) {
            case TabType.CSV:
                return <CsvTab {...v}/>;
            case TabType.AVG:
                return <AvgTab {...v}/>;
            case TabType.GRAPH:
                return <GraphTab {...v}/>;
            default:
                return noUnhandledCase(v);
        }
    }

    return <TabContent className="border border-primary rounded p-3 h-100">
        {props.tabs.map(v => {
            const element = getElement(v);
            let activeClasses = v.id === props.selectedTab ? 'show active' : 'd-none';
            return <TabPane className={`h-100 ${activeClasses}`} key={v.id}>
                {element}
            </TabPane>
        })}
    </TabContent>
}

export const Tabs: React.FunctionComponent<TabsProps> = function Tabs(props: TabsProps) {
    return props.tabs.length ? <div className="d-flex w-100 h-100 flex-column">
        <div>
            {tabsHeader(props)}
        </div>
        <div className="flex-grow-1">
            {tabsContainer(props)}
        </div>
    </div> : null;
};
