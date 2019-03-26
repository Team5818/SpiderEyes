export interface JsonSafeCodec<D, E> {
    encode(value: D): E

    decode(value: E): D
}
