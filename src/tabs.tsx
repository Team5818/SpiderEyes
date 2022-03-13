import React, {ReactNode, useState} from "react";
import {Col, Nav, NavItem, NavLink, Row, TabContent, TabPane} from "reactstrap";
import {CsvModController} from "./mods/CsvModController";
import {AvgTabProps, CsvTabProps, GraphTabProps, TabProps, TabType} from "./tabTypes";
import {AdvancedTable} from "./AdvancedTable";
import {noUnhandledCase} from "./utils";
import {Graph} from "./Graph";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faCalculator, faChartLine, faFileAlt, faSquareXmark} from "@fortawesome/free-solid-svg-icons";
import {IconProp} from "@fortawesome/fontawesome-svg-core";


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
    return <span
        className={`${hover ? 'text-info' : ''} d-flex align-items-top`}
        onMouseEnter={(): void => setHover(true)}
        onMouseLeave={(): void => setHover(false)}
        onClick={(e): void => {
            e.preventDefault();
            closeTab();
        }}>
        <FontAwesomeIcon icon={faSquareXmark}/>
    </span>;
};

function tabsHeader(props: TabsProps): ReactNode {
    function getTabIcon(v: TabProps): IconProp {
        switch (v.type) {
            case TabType.CSV:
                return faFileAlt;
            case TabType.AVG:
                return faCalculator;
            case TabType.GRAPH:
                return faChartLine;
            default:
                return noUnhandledCase(v);
        }
    }

    return <Nav tabs className="border-primary" id="tab-holder">
        {props.tabs.map(v =>
            <NavItem key={v.id}
                     onClick={(e): void => {
                         e.preventDefault();
                         props.selectTab(v.id);
                     }}>
                <NavLink active={v.id === props.selectedTab} className="p-0">
                    <Row className="g-0">
                        <Col sm="auto" className="p-2">
                            <FontAwesomeIcon icon={getTabIcon(v)} size="3x"/>
                        </Col>
                        <Col sm="auto" className="pr-1  ">
                            <TabCloseButton closeTab={(): void => props.closeTab(v.id)}/>
                        </Col>
                    </Row>
                </NavLink>
            </NavItem>
        )}
    </Nav>;
}

function tabsContainer(props: TabsProps): ReactNode {
    function getElement(v: TabProps): ReactNode {
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
            const activeClasses = v.id === props.selectedTab ? 'show active' : 'd-none';
            return <TabPane className={`h-100 ${activeClasses}`} key={v.id}>
                {element}
            </TabPane>;
        })}
    </TabContent>;
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
