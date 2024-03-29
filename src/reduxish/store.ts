import {Action, createStore, Reducer} from "redux";
import {afsFactory} from "./slice";
import {TabProps, TabType} from "../tabTypes";
import {CsvData} from "../csv/CsvData";
import {defaultState, InternalState} from "./InternalState";
import {OTAction} from "./actionCreators.js";

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

export interface SetStateAction extends Action<'setState'> {
    payload: InternalState
}

export function setState(state: InternalState): SetStateAction {
    return {
        type: 'setState',
        payload: state
    };
}

export function addAndSelectTab(payload: TabProps): void {
    ISTATE.dispatch(Actions.addTab(payload));
    ISTATE.dispatch(Actions.selectTab(payload.id));
}

const mainReducer = slicer.getReducer();

function updateSelectedTab(prevState: InternalState | undefined, newState: InternalState): void {
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

        newState.selectedTab = tabVals[closestIndex]!.id;
    }
}

function correctErrors(newState: InternalState, prevState: InternalState | undefined): void {
    // correct "errors" -- like selecting a tab that doesn't exist.
    // maybe it's empty -- then this is fine, we'll fix it later!
    if (newState.tabs.size > 0 && !newState.tabs.has(newState.selectedTab)) {
        updateSelectedTab(prevState, newState);
    }
}

const fullReducer: Reducer<InternalState, OTAction<unknown>> = (prevState, action) => {
    if (action.type === 'setState') {
        const newState = (action as SetStateAction).payload;
        correctErrors(newState, prevState);
        return newState;
    }
    const newState = mainReducer(prevState, action);

    correctErrors(newState, prevState);

    return newState;
};

export const ISTATE = createStore(fullReducer, defaultState);
