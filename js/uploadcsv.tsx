import React from "react";
import {isDefined} from "./preconditions";
import {Actions, addAndSelectTab, ISTATE} from "./reduxish/store";
import {CsvData} from "./csvData";
import {CsvTabProps} from "./tabTypes";

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

        const reader = new FileReader();
        reader.onload = () => {
            ISTATE.dispatch(Actions.removeAllTabs(undefined));
            addAndSelectTab(new CsvTabProps(CsvData.parse(reader.result)));
        };
        reader.readAsText(csvFile);
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

    onFileChosen(e: JQuery.Event<HTMLElement, null>) {
        const target = e.currentTarget;
        if (target === null) {
            return;
        }
        let fileList = (target as HTMLInputElement).files;
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
            <input type="file" accept="text/csv;.csv" className="d-none" ref={(r: HTMLInputElement) => {
                $(r).on('change', e => {
                    this.onFileChosen(e);
                });
            }}/>
        </label>;
    }
}
