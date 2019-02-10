import {CharStream} from "./charStream";

export class FileStream implements CharStream {

    private readonly decoder = new TextDecoder("utf-8");
    private readonly file: Blob;
    private readonly chunkSize: number;
    private filePosition = 0;
    private currentString: Iterator<string> = ""[Symbol.iterator]();
    private done = false;

    constructor(file: Blob, chunkSize: number = 8192) {
        this.file = file;
        this.chunkSize = chunkSize;
    }

    private async loadNextChunk(): Promise<ArrayBuffer | undefined> {
        if (this.filePosition >= this.file.size) {
            return undefined;
        }
        const end = Math.min(this.filePosition + this.chunkSize, this.file.size);
        const next = this.file.slice(this.filePosition, end);
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = () => {
                const result = reader.result;
                if (!(result instanceof ArrayBuffer)) {
                    reject(new Error("Should have been an array buffer!"));
                    reader.onerror = null;
                    return;
                }
                resolve(new Int8Array(result));
                this.filePosition += this.chunkSize;
            };
            reader.onerror = () => {
                const error = reader.error;
                if (error) {
                    reject(error);
                    reader.onload = null;
                }
            };
            reader.readAsArrayBuffer(next);
        });
    }

    async nextCharacter(): Promise<string | undefined> {
        if (this.done) {
            return undefined;
        }
        let next = this.currentString.next();
        while (next.done) {
            const bytes = await this.loadNextChunk();
            if (typeof bytes === "undefined") {
                // no more data, do one last decode.
                const lastResult = this.decoder.decode();
                this.done = true;
                return lastResult;
            }
            this.currentString = this.decoder.decode(bytes, {stream: true})[Symbol.iterator]();
            next = this.currentString.next();
        }
        return next.value;
    }

}
