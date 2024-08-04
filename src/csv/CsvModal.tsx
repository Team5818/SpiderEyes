import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";
import React, {PropsWithChildren} from "react";
import {createRoot} from "react-dom/client";

const modalRoot = createRoot(document.getElementById('mountModal')!);

export function injectModal(modal: React.ReactElement): void {
    modalRoot.render(modal);
}

export function closeModal(): void {
    modalRoot.render([]);
}

export type CsvModalProps = PropsWithChildren<{
    title: string,
    submitLabel: string,
    onSubmit: React.ReactEventHandler<HTMLElement>
}>;

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
