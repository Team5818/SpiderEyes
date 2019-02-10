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
