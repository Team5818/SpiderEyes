import {noUnhandledCase} from "../utils";
import {CharStream, universalNewlines} from "../charStream";
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
    // Current character
    _currentChar: Promise<string | undefined> | undefined;
    get currentChar() : Promise<string | undefined> {
        return checkNotNull(this._currentChar, "Must have a character.");
    }

    loadNextChar() {
        this._currentChar = this.data.nextCharacter();
    }

    constructor(data: CharStream) {
        this.data = universalNewlines(data);
        this.state = State.COMMA;
    }

    pushCurrentValue(char: string | undefined) {
        this.values[this.values.length - 1].push(this.value.join(''));
        this.value = [];
        if (char === '\n') {
            this.values.push([]);
        }
    }

    unescaped(char: string | undefined) {
        this.loadNextChar();
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

    async escaped(char: string) {
        switch (char) {
            case '"':
                this.loadNextChar();
                const nextChar = await this.currentChar;
                this.loadNextChar();
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
                this.loadNextChar();
        }
    }

    comma(char: string) {
        switch (char) {
            case '"':
                this.loadNextChar();
                this.state = State.ESCAPED;
                break;
            default:
                this.state = State.UNESCAPED;
                break;
        }
    }

    async parse(): Promise<string[][]> {
        // initialize:
        this.loadNextChar();
        while (true) {
            const char = await this.currentChar;
            if (typeof char === "undefined") {
                break;
            }
            switch (this.state) {
                case State.UNESCAPED:
                    this.unescaped(char);
                    break;
                case State.ESCAPED:
                    await this.escaped(char);
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

export function parse(data: CharStream): Promise<string[][]> {
    return new Parser(data).parse();
}
