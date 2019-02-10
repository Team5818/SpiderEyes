import {noUnhandledCase} from "../utils";

enum State {
    UNESCAPED,
    ESCAPED,
    COMMA
}

class Parser {
    data: string;
    state: State;

    // Return value array
    values: string[][] = [[]];
    // Value being built
    value: string[] = [];
    // Current scan index
    i = 0;

    constructor(data: string) {
        this.data = data.replace(/\r\n/g, '\n');
        this.state = State.COMMA;
    }

    charAtOffset(offset: number): string | undefined {
        const index = this.i + offset;
        if (index < 0 || index >= this.data.length) {
            return undefined;
        }
        return this.data.charAt(index);
    }

    get currentChar() {
        return this.charAtOffset(0);
    }

    pushCurrentValue(char: string | undefined) {
        this.values[this.values.length - 1].push(this.value.join(''));
        this.value = [];
        if (char === '\n') {
            this.values.push([]);
        }
    }

    unescaped(char: string | undefined) {
        this.i++;
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

    escaped(char: string) {
        switch (char) {
            case '"':
                let nextChar = this.charAtOffset(1);
                this.i += 2;
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
                        throw new Error(`Invalid post-quote character: '${nextChar}'`);
                }
                break;
            default:
                this.value.push(char);
                this.i++;
        }
    }

    comma(char: string) {
        switch (char) {
            case '"':
                this.i++;
                this.state = State.ESCAPED;
                break;
            default:
                this.state = State.UNESCAPED;
                break;
        }
    }

    parse(): string[][] {
        while (this.i < this.data.length) {
            const char = this.currentChar;
            if (typeof char === "undefined") {
                throw new Error("what");
            }
            switch (this.state) {
                case State.UNESCAPED:
                    this.unescaped(char);
                    break;
                case State.ESCAPED:
                    this.escaped(char);
                    break;
                case State.COMMA:
                    this.comma(char);
                    break;
                default:
                    return noUnhandledCase(this.state);
            }
        }

        if (this.state == State.UNESCAPED) {
            // wrap-up value
            this.unescaped(undefined);
        }
        return this.values;
    }
}

export function parse(data: string): string[][] {
    return new Parser(data).parse();
}
