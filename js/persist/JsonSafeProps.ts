import {AvgTabProps, CsvTabProps, TabProps, TabType} from "../tabTypes";
import {JsonSafeData} from "./JsonSafeData";
import {noUnhandledCase} from "../utils";
import {JsonSafeCodec} from "./JsonSafe";

interface JsonSafeProps<PT extends TabProps> {
    readonly id: string
    readonly type: PT['type']
}

interface CsvJSP extends JsonSafeProps<CsvTabProps> {
    readonly data: JsonSafeData
}

interface AvgJSP extends JsonSafeProps<AvgTabProps> {
    readonly data: JsonSafeData
}

// No graph persistence for now. A little too complex.
export type AllJsonSafeProps = CsvJSP | AvgJSP;
export type HandledTabProps = CsvTabProps | AvgTabProps;

export namespace JsonSafeProps {
    export const CODEC: JsonSafeCodec<HandledTabProps, AllJsonSafeProps> = {
        encode(value: HandledTabProps): AllJsonSafeProps {
            switch (value.type) {
                case TabType.CSV:
                    return {
                        id: value.id,
                        type: TabType.CSV,
                        data: JsonSafeData.CODEC.encode(value.data)
                    };
                case TabType.AVG:
                    return {
                        id: value.id,
                        type: TabType.AVG,
                        data: JsonSafeData.CODEC.encode(value.data)
                    };
                default:
                    return noUnhandledCase(value);
            }
        },
        decode(value: AllJsonSafeProps): HandledTabProps {
            switch (value.type) {
                case TabType.CSV:
                    return new CsvTabProps(JsonSafeData.CODEC.decode(value.data), value.id);
                case TabType.AVG:
                    return new AvgTabProps(JsonSafeData.CODEC.decode(value.data), value.id);
                default:
                    return noUnhandledCase(value);
            }
        }
    }
}
