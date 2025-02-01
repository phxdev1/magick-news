declare module 'hnswlib-node' {
  export class HierarchicalNSW {
    constructor(spaceType: 'cosine' | 'l2' | 'ip', dimension: number);
    initIndex(maxElements: number): void;
    addPoint(point: number[] | Float32Array, label: number): void;
    writeIndex(filename: string): void;
    readIndex(filename: string): void;
    searchKnn(query: number[] | Float32Array, k: number): {
      neighbors: number[];
      distances: number[];
    };
  }
}