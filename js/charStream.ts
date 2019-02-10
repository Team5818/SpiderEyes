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

export type ProgressCallback = () => void;

class ProgressTrackingCharStream extends DelegatingCharStream implements CharStream {
    readonly callbacks: ProgressCallback[];

    constructor(c: CharStream, callbacks: ProgressCallback[]) {
        super(c);
        this.callbacks = callbacks;
    }

    async nextCharacter(): Promise<string | undefined> {
        const next = await super.nextCharacter();
        if (typeof next !== "undefined") {
            this.callbacks.forEach(x => x());
        }
        return next;
    }
}

export function trackProgress(c: CharStream, ...callbacks: ProgressCallback[]): CharStream {
    if (c instanceof ProgressTrackingCharStream) {
        c.callbacks.push(...callbacks);
        return c;
    }
    return new ProgressTrackingCharStream(c, callbacks);
}
