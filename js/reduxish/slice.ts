import {newAction, OTAction} from "./actionCreators";
import {AnyAction, Reducer} from "redux";
import {oKeys, StringKeys} from "../utils";

export type ActionForSliceTransform<STATE, P> = (prevState: STATE, payload: P) => STATE

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

    getReducer(): Reducer<STATE>
}

type TransformCollection<SLICE> = {
    [type: string]: ActionForSliceTransform<SLICE, any> | undefined
};

class AFSFactoryImpl<STATE extends { [k: string]: any }> implements ActionForSliceFactory<STATE> {
    sliceTransforms: { [S in StringKeys<STATE>]?: TransformCollection<STATE[S]> } = {};
    typeCheck = new Set<string>();

    newAction<P, S extends StringKeys<STATE>>(stateSlice: S, type: string, transform: ActionForSliceTransform<STATE[S], P>) {
        if (this.typeCheck.has(type)) {
            throw new Error(`Already seen type ${type}!`);
        }
        this.typeCheck.add(type);
        let transColl = this.sliceTransforms[stateSlice];
        if (typeof transColl === "undefined") {
            this.sliceTransforms[stateSlice] = transColl = {};
        }
        transColl[type] = transform;
        return Object.assign((payload: P) => newAction(type, payload),
            {
                type: type,
                slice: stateSlice
            });
    }

    getReducer(): Reducer<STATE> {
        return (prevState, action: AnyAction) => {
            const newState = Object.assign({}, prevState);
            for (let key of oKeys(this.sliceTransforms)) {
                let sliceTransform = this.sliceTransforms[key];
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