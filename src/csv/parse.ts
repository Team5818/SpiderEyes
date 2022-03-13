import {noUnhandledCase} from "../utils";
import {CharStream, isEoS, universalNewlines} from "../charStream";
import {checkNotNull} from "../preconditions";

enum State {
    UNESCAPED,
    ESCAPED,
    COMMA
}

class Parser {
    data: CharStream;
    state: State;

    // Return value array
    values: string[][] = [[]];
    // Value being built
    value: string[] = [];
    // Current iterator for characters
    buffer: Promise<Iterator<string> | undefined> = Promise.resolve(""[Symbol.iterator]());
    currentChar: string | undefined;

    async loadNextChar(): Promise<void> {
        let next: IteratorResult<string> | undefined;
        while (typeof next === "undefined") {
            const iter = await this.buffer;
            if (typeof iter === "undefined") {
                this.currentChar = undefined;
                return;
            }
            next = iter.next();
            if (next.done) {
                next = undefined;
                this.buffer = this.data.nextBuffer()
                    .then(x => isEoS(x) ? undefined : x[Symbol.iterator]());
            }
        }
        this.currentChar = checkNotNull(next.value, "Must have a character.");
    }

    constructor(data: CharStream) {
        this.data = universalNewlines(data);
        this.state = State.COMMA;
    }

    pushCurrentValue(char: string | undefined): void {
        this.values[this.values.length - 1]!.push(this.value.join(''));
        this.value = [];
        if (char === '\n') {
            this.values.push([]);
        }
    }

    async unescaped(char: string | undefined): Promise<void> {
        await this.loadNextChar();
        switch (char) {
            case ',':
            case '\n':
            case undefined:
                this.pushCurrentValue(char);
                this.state = State.COMMA;
                break;
            default:
                this.value.push(char);
        }
    }

    async escaped(char: string): Promise<void> {
        if (char === '"') {
            await this.loadNextChar();
            const nextChar = this.currentChar;
            await this.loadNextChar();
            switch (nextChar) {
                case '"':
                    this.value.push('"');
                    break;
                case ',':
                case '\n':
                case undefined:
                    this.pushCurrentValue(nextChar);
                    this.state = State.COMMA;
                    break;
                default:
                    throw new Error(`Invalid post-quote character: 0x${(nextChar.codePointAt(0) || 0).toString(16)}`);
            }
        } else {
            this.value.push(char);
            await this.loadNextChar();
        }
    }

    async comma(char: string): Promise<void> {
        switch (char) {
            case '"':
                await this.loadNextChar();
                this.state = State.ESCAPED;
                break;
            default:
                this.state = State.UNESCAPED;
                break;
        }
    }

    async parse(): Promise<string[][]> {
        // initialize:
        await this.loadNextChar();
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const char = await this.currentChar;
            if (typeof char === "undefined") {
                break;
            }
            switch (this.state) {
                case State.UNESCAPED:
                    await this.unescaped(char);
                    break;
                case State.ESCAPED:
                    await this.escaped(char);
                    break;
                case State.COMMA:
                    await this.comma(char);
                    break;
                default:
                    return noUnhandledCase(this.state);
            }
        }

        if (this.state == State.UNESCAPED) {
            // wrap-up value
            await this.unescaped(undefined);
        }
        if (this.values[this.values.length - 1]!.length === 0) {
            // no last row, drop it.
            this.values.splice(this.values.length - 1, 1);
        }
        return this.values;
    }
}

export function parse(data: CharStream): Promise<string[][]> {
    return new Parser(data).parse();
}
