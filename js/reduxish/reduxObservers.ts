import {Store} from "redux";

export function observeStoreSlice<STATE, SLICE>(store: Store<STATE>, selector: (state: STATE) => SLICE, onChange: (state: SLICE) => void) {
    let currentState: SLICE | undefined = undefined;

    function handleChange() {
        const nextState: SLICE = selector(store.getState());
        if (nextState !== currentState) {
            currentState = nextState;
            onChange(currentState);
        }
    }

    let unsubscribe = store.subscribe(handleChange);
    handleChange();
    return unsubscribe;
}
