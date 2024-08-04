import "floatthead";
import React from "react";
import {connect, Provider} from "react-redux";
import {Actions, ISTATE, setState} from "./reduxish/store";
import {Tabs} from "./tabs";
import {VERSION} from "./constants";
import {UploadCsv} from "./uploadcsv";
import {InternalState} from "./reduxish/InternalState";
import {PromiseGate} from "./persist/PromiseGate";
import {retrievePersistedState, storeState} from "./persist/persistor";
import {afterNextRender} from "./utils";
import {createRoot} from "react-dom/client";

const LocalTabs = connect(
    (ISTATE: InternalState) => {
        return {
            tabs: Array.from(ISTATE.tabs.values()),
            selectedTab: ISTATE.selectedTab
        };
    },
    (dispatch) => {
        return {
            selectTab(i: string): void {
                dispatch(Actions.selectTab(i));
            },
            closeTab(i: string): void {
                dispatch(Actions.removeTab(i));
            }
        };
    }
)(Tabs);

let hasLoadedExistingState = false;
ISTATE.subscribe(() => {
    if (!hasLoadedExistingState) {
        return;
    }

    afterNextRender()
        .then(() => storeState(ISTATE.getState()))
        .then(changed => {
            if (changed) {
                console.log("Stored new state.");
            }
        })
        .catch(err => {
            console.error("Error storing new state", err);
        });
});

async function maybeSleep<T>(ftr: Promise<T>, start: number): Promise<T> {
    const result = await ftr;
    const diff = Date.now() - start;
    const remaining = 500 - diff;
    if (remaining > 0) {
        await new Promise(resolve => {
            setTimeout(() => resolve(void 0), remaining);
        });
    }
    return result;
}

export function mountApp(): void {
    const start = Date.now();
    const stateFuture = maybeSleep(afterNextRender()
        .then(() => retrievePersistedState())
        .then(state => {
            ISTATE.dispatch(setState(state));
            console.log("Loaded existing state.");
            hasLoadedExistingState = true;
        }).catch(err => {
            console.error("Error loading existing state", err);
            hasLoadedExistingState = true;
        }), start);
    const waiting = <div className="w-100 h-100 d-flex flex-column align-items-center align-content-center">
        <p>Loading existing state, please wait...</p>
    </div>;
    createRoot(document.getElementById('mount')!).render(<Provider store={ISTATE}>
        <PromiseGate blocker={stateFuture} waiting={waiting}>
            <LocalTabs/>
        </PromiseGate>
    </Provider>);
    createRoot(document.getElementById('mountUpload')!).render(<UploadCsv/>);
    document.getElementById("versionHolder")!.innerText = VERSION;
}
