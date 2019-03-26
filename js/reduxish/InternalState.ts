import {TabProps} from "../tabTypes";

export interface InternalState {
    tabs: Map<string, TabProps>
    selectedTab: string
    loadingProgress: number | undefined
}

export const defaultState: InternalState = {
    tabs: new Map(),
    selectedTab: '',
    loadingProgress: undefined,
};
