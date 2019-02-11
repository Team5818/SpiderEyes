import "object.entries";
import "floatthead";
import $ from "jquery";
import React from "react";
import ReactDOM from "react-dom";
import {connect, Provider} from "react-redux";
import {Actions, addAndSelectTab, InternalState, ISTATE} from "./reduxish/store";
import {Tabs} from "./tabs";
import {VERSION} from "./constants";
import {UploadCsv} from "./uploadcsv";
import {CsvData} from "./csv/CsvData";
import {closeModal} from "./csv/CsvModal";
import {CsvTabProps} from "./tabTypes";
import {FileStream} from "./fileStream";

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
    ReactDOM.render(<Provider store={ISTATE}>
        <LocalTabs/>
    </Provider>, document.getElementById('mount'));
    ReactDOM.render(<UploadCsv/>, document.getElementById("mountUpload"));
    document.getElementById("versionHolder")!!.innerText = VERSION;

    let data = ["Team,Match,A,B,C,D\n"];
    for (let i = 0; i < 1000; i++) {
        data.push(`5818,${i},${Math.random() * 100},${Math.random() * 100},${Math.random() * 100},${Math.random() * 100}\n`);
    }
    let blob = new Blob(data);
    CsvData.parse(new FileStream(blob)).then(data => {
        closeModal();
        ISTATE.dispatch(Actions.removeAllTabs(undefined));
        addAndSelectTab(new CsvTabProps(data));
    }).catch(err => {
        console.error("Error loading CSV data", err);
    });
});
