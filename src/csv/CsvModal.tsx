import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";
import React from "react";
import ReactDOM from "react-dom";

export function injectModal(modal: React.ReactElement): void {
    ReactDOM.render(modal, document.getElementById('mountModal'));
}

export function closeModal(): void {
    ReactDOM.render([], document.getElementById('mountModal'));
}

export type CsvModalProps = {
    title: string,
    submitLabel: string,
    onSubmit: React.ReactEventHandler<HTMLElement>
};

export const CsvModal: React.FunctionComponent<CsvModalProps> = function CsvModal(props) {
    function submitModal(e: React.SyntheticEvent<HTMLElement>): void {
        e.preventDefault();
        closeModal();
        props.onSubmit(e);
    }

    return <Modal isOpen={true} toggle={closeModal} backdrop='static' size="huge"
                  onSubmit={submitModal}>
        <ModalHeader toggle={closeModal}>
            {props.title}
        </ModalHeader>
        <ModalBody className="p-3">
            {props.children}
        </ModalBody>
        <ModalFooter>
            <Button color="secondary" onClick={closeModal}>Cancel</Button>
            <Button color="primary" onClick={submitModal}>{props.submitLabel}</Button>
        </ModalFooter>
    </Modal>;
};
