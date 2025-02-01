declare namespace JSX {
  interface Element {
    [key: string]: any;
  }
  interface ElementClass {
    render(): Element;
  }
  interface IntrinsicElements {
    [key: string]: any;
  }
}