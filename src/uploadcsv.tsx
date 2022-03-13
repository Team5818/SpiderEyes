import React, {ReactNode} from "react";
import {isDefined} from "./preconditions";
import {Actions, addAndSelectTab, ISTATE} from "./reduxish/store";
import {CsvData} from "./csv/CsvData";
import {CsvTabProps} from "./tabTypes";
import {FileStream} from "./fileStream";
import {CharStream, trackProgress} from "./charStream";
import {closeModal, injectModal} from "./csv/CsvModal";
import {connect, Provider} from "react-redux";
import {LoadingModal} from "./LoadingModal";
import {InternalState} from "./reduxish/InternalState";
import $ from "jquery";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUpload} from "@fortawesome/free-solid-svg-icons";

const FileLoadingModal = connect(
    (state: InternalState) => ({
        progress: state.loadingProgress || 0
    })
)(LoadingModal);

const MIN_PROGRESS_SIZE = 8192;

export class UploadCsv extends React.Component<unknown, {
    hovered: boolean
    fileValue?: File
}> {

    constructor(props: unknown) {
        super(props);
        this.state = {
            hovered: false
        };
    }

    pullFiles(dt: DataTransfer): File[] {
        if (dt.items) {
            return Array.from(dt.items)
                .map(d => d.getAsFile())
                .filter(isDefined);
        }
        return Array.from(dt.items);
    }

    onDrop(e: React.DragEvent<HTMLElement>): void {
        e.preventDefault();
        this.onExit();
        const files = this.pullFiles(e.dataTransfer);
        this.onFileUpload(files);
    }

    onFileUpload(files: File[]): void {
        // assume first file is the csv data
        const csvFile = files[0];
        if (!csvFile || !csvFile.name.endsWith('.csv')) {
            return;
        }

        let stream: CharStream = new FileStream(csvFile, 128);
        if (csvFile.size > MIN_PROGRESS_SIZE) {
            ISTATE.dispatch(Actions.updateLoadingProgress(0));
            injectModal(<Provider store={ISTATE}>
                <FileLoadingModal fileName={csvFile.name} maximumProgress={csvFile.size}/>
            </Provider>);
            const delta = Math.min(1000, csvFile.size / 1000);
            stream = trackProgress(stream, progress => {
                ISTATE.dispatch(Actions.updateLoadingProgress(progress));
            }, delta);
        }
        CsvData.parse(stream).then(data => {
            closeModal();
            ISTATE.dispatch(Actions.removeAllTabs(undefined));
            addAndSelectTab(new CsvTabProps(data));
        }).catch(err => {
            console.error("Error loading CSV data", err);
        });
    }

    onDragOver(e: React.DragEvent<HTMLElement>): void {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    onEnter(): void {
        this.setState(prevState => ({...prevState, hovered: true}));
    }

    onExit(): void {
        this.setState(prevState => ({...prevState, hovered: false}));
    }

    onClick(e: React.MouseEvent<HTMLElement>): void {
        e.preventDefault();
        // Click open the file input
        const inputs = $(e.currentTarget).siblings('input');
        if (typeof inputs[0] === "undefined") {
            console.error("Failed to open the file input");
            return;
        }
        inputs[0].click();
    }

    onFileChosen(e: React.ChangeEvent<HTMLInputElement>): void {
        const target = e.currentTarget;
        if (target === null) {
            return;
        }
        const fileList = target.files;
        if (fileList === null) {
            return;
        }
        this.onFileUpload(Array.from(fileList));
    }

    override render(): ReactNode {
        return <label className="m-0">
            <span
                className={this.state.hovered ? 'text-primary' : 'text-secondary'}
                onDrop={this.onDrop.bind(this)}
                onDragOver={this.onDragOver.bind(this)}
                onDragEnter={this.onEnter.bind(this)}
                onDragLeave={this.onExit.bind(this)}
                onMouseEnter={this.onEnter.bind(this)}
                onMouseLeave={this.onExit.bind(this)}
                onClick={this.onClick.bind(this)}>
                <FontAwesomeIcon
                    icon={faUpload}
                    size="3x"
                />
            </span>
            <input type="file" accept=".csv" hidden onChange={this.onFileChosen.bind(this)}/>
        </label>;
    }
}
