import {newAction, OTAction} from "./actionCreators";
import {Reducer} from "redux";
import {oKeys, StringKeys} from "../utils";

export type ActionForSliceTransform<STATE, P> = (prevState: STATE | undefined, payload: P) => STATE

export interface ActionForSlice<P> {
    (payload: P): OTAction<P>

    type: string
    slice: string
}

export interface ActionForSliceFactory<STATE> {
    newAction<P, S extends StringKeys<STATE>>(
        stateSlice: S,
        type: string,
        transform: ActionForSliceTransform<STATE[S], P>
    ): ActionForSlice<P>

    getReducer(): Reducer<STATE, OTAction<unknown>>
}

type TransformCollection<SLICE> = {
    [type: string]: ActionForSliceTransform<SLICE, unknown> | undefined
};

class AFSFactoryImpl<STATE> implements ActionForSliceFactory<STATE> {
    sliceTransforms: { [S in StringKeys<STATE>]?: TransformCollection<STATE[S]> } = {};
    typeCheck = new Set<string>();

    newAction<P, S extends StringKeys<STATE>>(
        stateSlice: S, type: string,
        transform: ActionForSliceTransform<STATE[S], P>
    ): ActionForSlice<P> {
        if (this.typeCheck.has(type)) {
            throw new Error(`Already seen type ${type}!`);
        }
        this.typeCheck.add(type);
        let transColl = this.sliceTransforms[stateSlice];
        if (typeof transColl === "undefined") {
            this.sliceTransforms[stateSlice] = transColl = {};
        }
        transColl[type] = transform as ActionForSliceTransform<STATE[S], unknown>;
        return Object.assign((payload: P) => newAction(type, payload),
            {
                type: type,
                slice: stateSlice
            });
    }

    getReducer(): Reducer<STATE, OTAction<unknown>> {
        return (prevState, action: OTAction<unknown>) => {
            const newState: STATE = Object.assign({}, prevState);
            for (const key of oKeys(this.sliceTransforms)) {
                const sliceTransform = this.sliceTransforms[key];
                if (typeof sliceTransform === "undefined") {
                    throw new Error("This can't happen.");
                }
                const reducerSlice = sliceTransform[action.type];
                if (reducerSlice) {
                    newState[key] = reducerSlice(newState[key], action.payload);
                }
            }
            return newState;
        };
    }
}

export function afsFactory<STATE>(): ActionForSliceFactory<STATE> {
    return new AFSFactoryImpl<STATE>();
}
