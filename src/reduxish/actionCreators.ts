import {Action} from "redux";

export interface OTAction<P> extends Action {
    type: string
    payload: P
}

export function newAction<P>(type: string, payload: P): OTAction<P> {
    return {type: type, payload: payload};
}
