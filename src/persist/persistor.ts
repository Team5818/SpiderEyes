import {defaultState, InternalState} from "../reduxish/InternalState";
import {oKeys} from "../utils";
import {AllJsonSafeProps, JSON_SAFE_PROPS_CODEC} from "./JsonSafeProps";
import {GraphTabProps, TabProps} from "../tabTypes";

type LS = {
    tabs: 'tabs',
    selectedTab: 'selectedTab'
};
const LOCAL_STORAGE: LS = {
    tabs: 'tabs',
    selectedTab: 'selectedTab'
};

type Loaders = {
    [N in keyof LS]: (state: InternalState[N], local: string) => InternalState[N];
};

type Savers = {
    [N in keyof LS]: (state: InternalState[N]) => string;
};

const LOADERS: Loaders = {
    tabs(state, local) {
        const json = JSON.parse(local) as Record<string, AllJsonSafeProps>;
        for (const key of oKeys(json)) {
            const value = JSON_SAFE_PROPS_CODEC.decode(json[key]!);
            if (key !== value.id) {
                throw new Error("Mis-matched ID from loaded props.");
            }
            state.set(key, value);
        }
        return state;
    },
    selectedTab(state, local) {
        return local;
    }
};

const SAVERS: Savers = {
    tabs(state) {
        const json: Record<string, AllJsonSafeProps> = {};
        for (const [k, v] of state) {
            if (!(v instanceof GraphTabProps)) {
                json[k] = JSON_SAFE_PROPS_CODEC.encode(v);
            }
        }
        return JSON.stringify(json);
    },
    selectedTab(state) {
        return state;
    }
};

export async function retrievePersistedState(): Promise<InternalState> {
    const result = defaultState;
    for (const ls of oKeys(LOCAL_STORAGE)) {
        const local = localStorage.getItem(ls);
        if (local === null) {
            continue;
        }
        result[ls] = LOADERS[ls](result[ls] as Map<string, TabProps> & string, local) as Map<string, TabProps> & string;
    }
    return result;
}

let lastState: InternalState | undefined = undefined;

export async function storeState(state: InternalState): Promise<boolean> {
    if (typeof lastState !== "undefined" &&
        oKeys(LOCAL_STORAGE).every(k => Object.is(lastState![k], state[k]))) {
        return false;
    }
    lastState = state;
    for (const ls of oKeys(LOCAL_STORAGE)) {
        localStorage.setItem(ls, SAVERS[ls](state[ls] as Map<string, TabProps> & string));
    }
    return true;
}
