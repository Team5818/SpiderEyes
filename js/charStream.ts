export interface CharStream {
    nextCharacter(): Promise<string | undefined>
}

export class DelegatingCharStream implements CharStream {
    readonly delegate: CharStream;

    constructor(delegate: CharStream) {
        this.delegate = delegate;
    }

    nextCharacter(): Promise<string | undefined> {
        return this.delegate.nextCharacter();
    }
}

class LineCleaningCharStream extends DelegatingCharStream implements CharStream {
    private emitThisFirst: string | undefined = undefined;

    async nextCharacter(): Promise<string | undefined> {
        if (typeof this.emitThisFirst !== "undefined") {
            return this.emitThisFirst;
        }
        const nextCharacter = await super.nextCharacter();
        if (nextCharacter === '\r') {
            const possibleNewline = await super.nextCharacter();
            if (possibleNewline === '\n') {
                return '\n';
            }
            // no newline, so just emit both
            // the '\r' from this round, and the peeked character next time
            this.emitThisFirst = possibleNewline;
        }
        return nextCharacter;
    }
}

export function universalNewlines(c: CharStream): CharStream {
    if (c instanceof LineCleaningCharStream) {
        return c;
    }
    return new LineCleaningCharStream(c);
}

export type ProgressCallback = (value: number) => void;

class ProgressTrackingCharStream extends DelegatingCharStream implements CharStream {
    private readonly callback: ProgressCallback;
    private readonly delta: number;
    private buffer: number = 0;
    private counter: number = 0;

    constructor(c: CharStream, callback: ProgressCallback, delta: number) {
        super(c);
        this.callback = callback;
        this.delta = delta;
    }

    async nextCharacter(): Promise<string | undefined> {
        const next = await super.nextCharacter();
        if (typeof next !== "undefined") {
            this.buffer++;
            if (this.buffer >= this.delta) {
                this.counter += this.buffer;
                this.buffer = 0;
                this.callback(this.counter);
            }
        } else {
            this.callback(this.counter + this.buffer);
        }
        return next;
    }
}

export function trackProgress(c: CharStream, callback: ProgressCallback, delta: number = 1): CharStream {
    return new ProgressTrackingCharStream(c, callback, delta);
}
