import {createStore, Reducer} from "redux";
import {CsvData} from "../csv/CsvData";
import {afsFactory} from "./slice";
import {CsvTabProps, TabProps} from "../tabTypes";


export interface InternalState {
    tabs: TabProps[]
    selectedTab: string
}

const defaultState: InternalState = {
    tabs: [],
    selectedTab: ''
};

const slicer = afsFactory<InternalState>();

export const Actions = {
    addTab: slicer.newAction('tabs', 'addTab', (state, payload: TabProps) => {
        const tabs = state.slice();
        tabs.push(payload);
        return tabs;
    }),
    selectTab: slicer.newAction('selectedTab', 'selectTab', (state, payload: string) => {
        return payload;
    }),
    removeTab: slicer.newAction('tabs', 'removeTab', (oldTabs, delId: string) => {
        return oldTabs.filter(v => v.id !== delId);
    }),
    removeTabByType: slicer.newAction('tabs', 'removeTabByType', (oldTabs, tabType: Function) => {
        return oldTabs.filter(v => !(v instanceof tabType));
    }),
    removeAllTabs: slicer.newAction<undefined, 'tabs'>('tabs', 'removeAllTabs', () => {
        return [];
    })
};

export function addAndSelectTab(payload: TabProps) {
    ISTATE.dispatch(Actions.addTab(payload));
    ISTATE.dispatch(Actions.selectTab(payload.id));
}

const reduxDevtools: (() => any) | undefined = (window as any)['__REDUX_DEVTOOLS_EXTENSION__'];

const mainReducer = slicer.getReducer();

const fullReducer: Reducer<InternalState> = (prevState, action) => {
    let newState = mainReducer(prevState, action);

    // correct "errors" -- like selecting a tab that doesn't exist.
    // maybe it's empty -- then this is fine, we'll fix it later!
    if (newState.tabs.length && !newState.tabs.some(tab => tab.id === newState.selectedTab)) {
        // select the closest tab, or 0 if not present / already 0
        let closestIndex = Math.max(0,
            typeof prevState === "undefined"
                ? 0
                : prevState.tabs.findIndex(tab => tab.id === newState.selectedTab) - 1);

        // find the closest index, it is guaranteed that there is at least one tab
        while (typeof newState.tabs[closestIndex] === "undefined" && closestIndex > 0) {
            closestIndex--;
        }

        newState.selectedTab = newState.tabs[closestIndex].id;
    }
    return newState;
};

export const ISTATE = createStore(fullReducer, defaultState, reduxDevtools && reduxDevtools());
