import React, {useState} from "react";

export interface PromiseGateProps {
    blocker: Promise<any>
    waiting?: React.ReactNode
    children: React.ReactNode
}

/**
 * Block display of {@code children} until the given promise resolves.
 *
 * It will display {@code waiting} instead, if defined.
 */
export const PromiseGate: React.FunctionComponent<PromiseGateProps> = (props) => {
    const [resolved, setResolved] = useState(false);

    props.blocker.then(() => setResolved(true));

    return <>{resolved ? props.children : props.waiting}</>;
};