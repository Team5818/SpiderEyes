export const EndOfStream = {
    end: true
};

export function isEoS(result: CharStreamResult): result is typeof EndOfStream {
    return result === EndOfStream;
}

export type CharStreamResult = string | typeof EndOfStream;

export interface CharStream {
    nextBuffer(): Promise<CharStreamResult>
}

export class DelegatingCharStream implements CharStream {
    readonly delegate: CharStream;

    constructor(delegate: CharStream) {
        this.delegate = delegate;
    }

    nextBuffer(): Promise<CharStreamResult> {
        return this.delegate.nextBuffer();
    }
}

/**
 * Support for replacing certain parts of a buffer efficiently.
 */
export abstract class BufferSplicingCharStream extends DelegatingCharStream {
    private readonly bufferStack: string[] = [];

    override async nextBuffer(): Promise<CharStreamResult> {
        while (this.bufferStack.length === 0) {
            const currentBuffer = await super.nextBuffer();
            if (isEoS(currentBuffer)) {
                return currentBuffer;
            }
            this.process(currentBuffer);
        }
        return this.bufferStack.shift()!;
    }

    /**
     * Take a buffer, and put some number of buffers onto the stack.
     *
     * If this buffer is to be unprocessed, simply put it all on the stack.
     */
    abstract process(buffer: string): void;

    addBuffer(buffer: string): void {
        this.bufferStack.push(buffer);
    }
}

class LineCleaningCharStream extends BufferSplicingCharStream implements CharStream {
    private waitingForNewline = false;

    process(buffer: string): void {
        const points = Array.from(buffer);
        for (let i = 0; i < points.length;) {
            const char = points[i];
            if (this.waitingForNewline) {
                this.waitingForNewline = false;
                if (char !== '\n') {
                    // we must put the '\r' back first.
                    this.addBuffer('\r');
                }
            } else if (char === '\r') {
                // Take all the points up to but not including '\r'
                // and push them out. the '\r' will be pushed later
                // if not matched with a newline.
                const buf = points.splice(0, i + 1).slice(0, i).join('');
                this.addBuffer(buf);
                i = 0;
                this.waitingForNewline = true;
                // avoid post-increment
                continue;
            }
            i++;
        }
        this.addBuffer(points.join(''));
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
    private buffer = 0;
    private counter = 0;

    constructor(c: CharStream, callback: ProgressCallback, delta: number) {
        super(c);
        this.callback = callback;
        this.delta = delta;
    }

    override async nextBuffer(): Promise<CharStreamResult> {
        const next = await super.nextBuffer();
        if (!isEoS(next)) {
            this.buffer += next.length;
            if (this.buffer >= this.delta) {
                this.counter += this.buffer;
                this.buffer = 0;
                this.callback(this.counter);
            }
        } else {
            if (this.buffer > 0) {
                this.callback(this.counter + this.buffer);
            }
        }
        return next;
    }
}

export function trackProgress(c: CharStream, callback: ProgressCallback, delta = 1): CharStream {
    return new ProgressTrackingCharStream(c, callback, delta);
}
