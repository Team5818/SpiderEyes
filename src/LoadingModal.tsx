import React from "react";
import {Modal, ModalBody, ModalHeader, Progress} from "reactstrap";
import {sprintf} from "sprintf-js";

export interface LoadingModalProps {
    fileName: string
    maximumProgress: number
    progress: number
}

export const LoadingModal: React.FunctionComponent<LoadingModalProps> = ({fileName, maximumProgress, progress}) => {
    const percent = (progress * 100) / maximumProgress;
    return <Modal isOpen={true} backdrop='static' size="md">
        <ModalHeader>
            Loading <code>{fileName}</code>...
        </ModalHeader>
        <ModalBody>
            <div className="m-auto w-75">
                <span>{sprintf('%d%%', percent)}</span>
                <Progress value={percent} max="100" animated/>
            </div>
        </ModalBody>
    </Modal>;
};