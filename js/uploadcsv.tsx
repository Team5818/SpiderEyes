import React from "react";
import {isDefined} from "./preconditions";
import {Actions, addAndSelectTab, InternalState, ISTATE} from "./reduxish/store";
import {CsvData} from "./csv/CsvData";
import {CsvTabProps} from "./tabTypes";
import {FileStream} from "./fileStream";
import {CharStream, trackProgress} from "./charStream";
import {closeModal, injectModal} from "./csv/CsvModal";
import {connect, Provider} from "react-redux";
import {LoadingModal} from "./LoadingModal";

const FileLoadingModal = connect(
    (state: InternalState) => ({
        progress: state.loadingProgress || 0
    })
)(LoadingModal);

const MIN_PROGRESS_SIZE = 8192;

export class UploadCsv extends React.Component<{}, {
    hovered: boolean
    fileValue?: File
}> {

    constructor(props: {}) {
        super(props);
        this.state = {
            hovered: false
        }
    }

    pullFiles(dt: DataTransfer): File[] {
        if (dt.items) {
            return Array.from(dt.items)
                .map(d => d.getAsFile())
                .filter(isDefined);
        }
        return Array.from(dt.items);
    }

    onDrop(e: React.DragEvent<HTMLElement>) {
        e.preventDefault();
        this.onExit();
        const files = this.pullFiles(e.dataTransfer);
        this.onFileUpload(files);
    }

    onFileUpload(files: File[]) {
        // assume first file is the csv data
        let csvFile = files[0];
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

    onDragOver(e: React.DragEvent<HTMLElement>) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    onEnter() {
        this.setState(prevState => ({...prevState, hovered: true}));
    }

    onExit() {
        this.setState(prevState => ({...prevState, hovered: false}));
    }

    onClick(e: React.MouseEvent<HTMLElement>) {
        e.preventDefault();
        // Click open the file input
        let inputs = $(e.currentTarget).siblings('input');
        inputs[0].click();
    }

    onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
        const target = e.currentTarget;
        if (target === null) {
            return;
        }
        let fileList = target.files;
        if (fileList === null) {
            return;
        }
        this.onFileUpload(Array.from(fileList));
    }

    render() {
        return <label className="m-0">
            <i className={`${this.state.hovered ? 'bg-primary' : 'bg-secondary'} p-2 rounded fas fa-upload fa-3x`}
               onDrop={this.onDrop.bind(this)}
               onDragOver={this.onDragOver.bind(this)}
               onDragEnter={this.onEnter.bind(this)}
               onDragLeave={this.onExit.bind(this)}
               onMouseEnter={this.onEnter.bind(this)}
               onMouseLeave={this.onExit.bind(this)}
               onClick={this.onClick.bind(this)}>
            </i>
            <input type="file" accept=".csv" className="d-none" onChange={this.onFileChosen.bind(this)}/>
        </label>;
    }
}
