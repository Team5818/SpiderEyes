import "object.entries";
import "floatthead";
import $ from "jquery";
import React from "react";
import ReactDOM from "react-dom";
import {connect, Provider} from "react-redux";
import {Actions, InternalState, ISTATE} from "./reduxish/store";
import {UploadCsv} from "./uploadcsv";
import {Tabs} from "./tabs";

const LocalTabs = connect(
    (ISTATE: InternalState) => {
        return {
            tabs: ISTATE.tabs,
            selectedTab: ISTATE.selectedTab
        }
    },
    (dispatch) => {
        return {
            selectTab(i: string) {
                dispatch(Actions.selectTab(i));
            },
            closeTab(i: string) {
                dispatch(Actions.removeTab(i));
            }
        };
    }
)(Tabs);


$(() => {
    ReactDOM.render(<div>
        <Provider store={ISTATE}>
            <LocalTabs/>
        </Provider>
    </div>, document.getElementById('mount'));
    ReactDOM.render(<UploadCsv/>, document.getElementById("mountUpload"));
});
