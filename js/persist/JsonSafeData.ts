import {CsvColumn, CsvData, CsvRow, Sort} from "../csv/CsvData";
import {CsvValueType} from "../csv/values";
import {JsonSafeCodec} from "./JsonSafe";

export interface JsonSafeData {
    readonly header: JsonSafeColumn[]
    readonly values: CsvRow[]
    readonly currentSort?: Sort
}

export namespace JsonSafeData {
    export const CODEC: JsonSafeCodec<CsvData, JsonSafeData> = {
        encode(value: CsvData): JsonSafeData {
            let result: JsonSafeData = {
                header: value.header.map(x => JsonSafeColumn.CODEC.encode(x)),
                values: value.values
            };
            if (typeof value.currentSort !== "undefined") {
                result = {...result, currentSort: value.currentSort};
            }
            return result;
        },
        decode(value: JsonSafeData): CsvData {
            return new CsvData(
                value.header.map(x => JsonSafeColumn.CODEC.decode(x)),
                value.values,
                value.currentSort
            );
        }
    };
}

export interface JsonSafeColumn {
    readonly name: string
    readonly type: CsvValueType
    readonly maxWidthChar: number
    readonly score: number
}

export namespace JsonSafeColumn {
    export const CODEC: JsonSafeCodec<CsvColumn, JsonSafeColumn> = {
        encode(value: CsvColumn): JsonSafeColumn {
            return {
                name: value.name,
                type: value.type,
                maxWidthChar: value.maxCharWidth,
                score: value.score
            };
        },
        decode(value: JsonSafeColumn): CsvColumn {
            return new CsvColumn(
                value.name,
                value.type,
                value.maxWidthChar,
                value.score
            );
        }
    };
}
