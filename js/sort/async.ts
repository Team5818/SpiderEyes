export interface Comparator<T> {
    (a: T, b: T): number
}

export class AsyncSorter<T> {
    private readonly data: T[];
    private readonly comparator: Comparator<T>;
    private readonly elementsPerOp: number;

    constructor(data: T[], comparator: Comparator<T>, elementsPerOp: number = 200) {
        this.data = data;
        this.comparator = comparator;
        this.elementsPerOp = elementsPerOp;
    }

    async sort(): Promise<T[]> {
        await this.delay();
        let remainingElements = this.elementsPerOp;
        const dataLen = this.data.length;
        let A = this.data;
        let B = this.data.slice();
        for (let width = 1; width < dataLen; width <<= 1) {
            const widthTimes2 = width << 1;
            for (let i = 0; i < dataLen; i += widthTimes2) {
                const left = i;
                const middle = Math.min(i + width, dataLen);
                const right = Math.min(i + widthTimes2, dataLen);

                this.merge(A, B, left, middle, right);

                remainingElements -= right - left;
                if (remainingElements <= 0) {
                    await this.delay();
                    remainingElements = this.elementsPerOp;
                }
            }
            // swap the arrays
            const swap = A;
            A = B;
            B = swap;
        }
        return A;
    }

    private merge(A: T[], B: T[], left: number, middle: number, right: number) {
        let i = left;
        let j = middle;
        let k = left;
        while (i < middle && j < right) {
            if (this.comparator(A[i], A[j]) < 0) {
                B[k++] = A[i++];
            } else {
                B[k++] = A[j++];
            }
        }
        while (i < A.length && i < middle) {
            B[k++] = A[i++];
        }
        while (k < A.length && j < right) {
            B[k++] = A[j++];
        }
    }

    /**
     * The "async" part of this sort -- inserts a delay by using animation frames.
     */
    private delay(): Promise<void> {
        return new Promise(resolve => requestAnimationFrame(() => resolve()));
    }
}
