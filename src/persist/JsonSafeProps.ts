import {AvgTabProps, CsvTabProps, TabProps, TabType} from "../tabTypes";
import {JSON_SAFE_DATA_CODEC, JsonSafeData} from "./JsonSafeData";
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

export const JSON_SAFE_PROPS_CODEC: JsonSafeCodec<HandledTabProps, AllJsonSafeProps> = {
    encode(value: HandledTabProps): AllJsonSafeProps {
        switch (value.type) {
            case TabType.CSV:
                return {
                    id: value.id,
                    type: TabType.CSV,
                    data: JSON_SAFE_DATA_CODEC.encode(value.data)
                };
            case TabType.AVG:
                return {
                    id: value.id,
                    type: TabType.AVG,
                    data: JSON_SAFE_DATA_CODEC.encode(value.data)
                };
            default:
                return noUnhandledCase(value);
        }
    },
    decode(value: AllJsonSafeProps): HandledTabProps {
        switch (value.type) {
            case TabType.CSV:
                return new CsvTabProps(JSON_SAFE_DATA_CODEC.decode(value.data), value.id);
            case TabType.AVG:
                return new AvgTabProps(JSON_SAFE_DATA_CODEC.decode(value.data), value.id);
            default:
                return noUnhandledCase(value);
        }
    }
};
