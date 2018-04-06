import React from "react";
import {isDefined} from "./preconditions";
import {Actions, addAndSelectTab, ISTATE} from "./reduxish/store";
import {CsvData} from "./csvData";
import {CsvTabProps} from "./tabTypes";

function pullFiles(dt: DataTransfer): File[] {
    if (dt.items) {
        return Array.from(dt.items)
            .map(d => d.getAsFile())
            .filter(isDefined);
    }
    return Array.from(dt.items);
}

function onDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    onExit(e);
    const files = pullFiles(e.dataTransfer);
    // assume first file is the csv data
    let csvFile = files[0];
    if (!csvFile.name.endsWith('.csv')) {
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        ISTATE.dispatch(Actions.removeAllTabs(undefined));
        addAndSelectTab(new CsvTabProps(CsvData.parse(reader.result)));
    };
    reader.readAsText(csvFile);
}

function onDragOver(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function onEnter(e: React.DragEvent<HTMLElement>) {
    e.currentTarget.classList.add('bg-primary');
    e.currentTarget.classList.remove('bg-info');
}

function onExit(e: React.DragEvent<HTMLElement>) {
    e.currentTarget.classList.remove('bg-primary');
    e.currentTarget.classList.add('bg-info');
}

export function UploadCsv() {
    return <i className="bg-info p-2 rounded fas fa-upload fa-3x" onDrop={onDrop}
              onDragOver={onDragOver}
              onDragEnter={onEnter}
              onDragLeave={onExit}>
    </i>;
}