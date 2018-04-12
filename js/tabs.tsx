import React from "react";
import {Col, Nav, NavItem, NavLink, Row, TabContent, TabPane} from "reactstrap";
import {CsvModController} from "./csvMod";
import {AvgTabProps, CsvTabProps, TabProps, TabType} from "./tabTypes";
import {AdvancedTable} from "./AdvancedTable";


export const CsvTab: React.StatelessComponent<CsvTabProps> = function CsvTab(props) {
    return <div>
        <CsvModController {...props}/>
        <AdvancedTable originalData={props.data}/>
    </div>;
};

export const AvgTab: React.StatelessComponent<AvgTabProps> = function AvgTab(props) {
    return <AdvancedTable originalData={props.data}/>
};

export type TabsProps = {
    tabs: TabProps[],
    selectedTab: string,
    selectTab: (i: string) => void,
    closeTab: (i: string) => void
}

type TabCloseButtonProps = {
    closeTab: () => void
};

type TabCloseButtonState = {
    hover: boolean
};

class TabCloseButton extends React.Component<TabCloseButtonProps, TabCloseButtonState> {
    constructor(props: TabCloseButtonProps) {
        super(props);
        this.state = {
            hover: false
        };
    }

    hover(hover: boolean) {
        this.setState(prevState => ({
            ...prevState,
            hover: hover
        }));
    }

    render() {
        return <div
            className={`${this.state.hover ? 'text-info' : ''}`}
            onMouseEnter={() => this.hover(true)}
            onMouseLeave={() => this.hover(false)}
            onClick={e => {
                e.preventDefault();
                this.props.closeTab();
            }}>
            <i className="fas fa-window-close"/>
        </div>;
    }
}

function tabsHeader(props: TabsProps) {
    function getTabType(v: TabProps): string {
        switch (v.type) {
            case TabType.CSV:
                return 'file-alt';
            case TabType.AVG:
                return 'chart-bar';
        }
    }

    return <Nav tabs className="border-primary">
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
        if (v.type === TabType.CSV) {
            return <CsvTab {...v}/>;
        }
        return <AvgTab {...v}/>;
    }

    return <TabContent className="border border-primary rounded p-3">
        {props.tabs.map(v => {
            const element = getElement(v);
            return <TabPane className={v.id === props.selectedTab ? 'show active' : 'd-none'} key={v.id}>
                {element}
            </TabPane>
        })}
    </TabContent>
}

export const Tabs: React.StatelessComponent<TabsProps> = function Tabs(props: TabsProps) {
    return props.tabs.length ? <div>
        {tabsHeader(props)}
        {tabsContainer(props)}
    </div> : null;
};
