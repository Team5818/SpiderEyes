import React from "react";
import {ModalProps, Modal} from "reactstrap";
import {Omit} from "type-zoo";

export type SimpleModalProps = Omit<ModalProps, 'isOpen'> & {
    body: React.ReactNode
};

type SimpleModalState = {
    isOpen: boolean
}

export class SimpleModal extends React.Component<SimpleModalProps, SimpleModalState> {
    constructor(props: SimpleModalProps) {
        super(props);
        this.state = {
            isOpen: false
        };
    }

    render() {
        return <Modal isOpen={this.state.isOpen} {...this.props}>

        </Modal>
    }
}