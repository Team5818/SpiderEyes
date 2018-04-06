///<reference types="jquery"/>

type FloatTheadOptions = {
    position?: 'auto' | 'fixed' | 'absolute',
    scrollContainer?: true | ((jq: JQuery) => JQuery),
    responsiveContainer?: (jq: JQuery) => JQuery,
    headerCellSelector?: string,
    floatTableClass?: string,
    floatContainerClass?: string,
    top?: number | ((jq: JQuery) => number),
    bottom?: number | ((jq: JQuery) => number),
    zIndex?: number,
    debug?: boolean,
    getSizingRow?: (jq: JQuery) => JQuery,
    copyTableClass?: boolean,
    autoReflow?: boolean
}

interface JQuery {
    floatThead(options?: FloatTheadOptions): JQuery

    floatThead(method: 'destroy'): () => void

    floatThead(method: 'reflow'): void

    floatThead(method: 'getRowGroups'): JQuery
}
