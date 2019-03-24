import {createStore, Reducer} from "redux";
import {afsFactory} from "./slice";
import {TabProps, TabType} from "../tabTypes";
import {CsvData} from "../csv/CsvData";


export interface InternalState {
    tabs: Map<string, TabProps>
    selectedTab: string
    loadingProgress: number | undefined
}

const defaultState: InternalState = {
    tabs: new Map(),
    selectedTab: '',
    loadingProgress: undefined,
};

const slicer = afsFactory<InternalState>();

export interface TabDataUpdate {
    id: string
    data: CsvData
}

export const Actions = {
    addTab: slicer.newAction('tabs', 'addTab', (state, payload: TabProps) => {
        const copy = typeof state === "undefined" ? new Map() : new Map(state);
        copy.set(payload.id, payload);
        return copy;
    }),
    selectTab: slicer.newAction('selectedTab', 'selectTab', (state, payload: string) => {
        return payload;
    }),
    updateTabData: slicer.newAction('tabs', 'updateTabData', (state, payload: TabDataUpdate) => {
        if (typeof state === "undefined") {
            return new Map();
        }
        const tab = state.get(payload.id);
        if (typeof tab === "undefined" || tab.type === TabType.GRAPH) {
            return state;
        }
        const copy = new Map(state);
        copy.set(payload.id, {
            ...tab,
            data: payload.data
        });
        return copy;
    }),
    removeTab: slicer.newAction('tabs', 'removeTab', (oldTabs, delId: string) => {
        if (typeof oldTabs === "undefined") {
            return new Map();
        }
        const newTabs = new Map(oldTabs);
        newTabs.delete(delId);
        return newTabs;
    }),
    removeAllTabs: slicer.newAction<undefined, 'tabs'>('tabs', 'removeAllTabs', () => {
        return new Map();
    }),
    updateLoadingProgress: slicer.newAction('loadingProgress', 'updateLoadingProgress', (state, payload: number) => {
        return payload;
    }),
};

export function addAndSelectTab(payload: TabProps) {
    ISTATE.dispatch(Actions.addTab(payload));
    ISTATE.dispatch(Actions.selectTab(payload.id));
}

const reduxDevtools: (() => any) | undefined = (window as any)['__REDUX_DEVTOOLS_EXTENSION__'];

const mainReducer = slicer.getReducer();

function updateSelectedTab(prevState: InternalState | undefined, newState: InternalState) {
    if (typeof prevState === "undefined") {
        newState.selectedTab = newState.tabs.keys().next().value;
    } else {
        // select the closest tab, or 0 if not present / already 0
        let closestIndex = Math.max(0,
            typeof prevState === "undefined"
                ? 0
                : Array.from(prevState.tabs.values()).findIndex(tab => tab.id === prevState.selectedTab) - 1);

        const tabVals = Array.from(newState.tabs.values());
        // find the closest index, it is guaranteed that there is at least one tab
        while (typeof tabVals[closestIndex] === "undefined" && closestIndex > 0) {
            closestIndex--;
        }

        newState.selectedTab = tabVals[closestIndex].id;
    }
}

const fullReducer: Reducer<InternalState> = (prevState, action) => {
    let newState = mainReducer(prevState, action);

    // correct "errors" -- like selecting a tab that doesn't exist.
    // maybe it's empty -- then this is fine, we'll fix it later!
    if (newState.tabs.size > 0 && !newState.tabs.has(newState.selectedTab)) {
        updateSelectedTab(prevState, newState);
    }
    return newState;
};

export const ISTATE = createStore(fullReducer, defaultState, reduxDevtools && reduxDevtools());
