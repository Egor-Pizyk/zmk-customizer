type MatrixValues = {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
};
type Matrix = MatrixValues & {
  readonly multiply: (next: MatrixValues) => Matrix;
  readonly inverse: () => Matrix;
  readonly translate: (x: number, y: number) => Matrix;
  readonly scale: (scale: number) => Matrix;
};

const IDENTITY_MATRIX = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } as const;

function createMatrix(input: MatrixValues = IDENTITY_MATRIX): Matrix {
  return {
    ...input,
    multiply(this: MatrixValues, next: MatrixValues) {
      return createMatrix({
        a: this.a * next.a + this.c * next.b,
        b: this.b * next.a + this.d * next.b,
        c: this.a * next.c + this.c * next.d,
        d: this.b * next.c + this.d * next.d,
        e: this.a * next.e + this.c * next.f + this.e,
        f: this.b * next.e + this.d * next.f + this.f,
      });
    },
    translate(this: Matrix, x: number, y: number) {
      return this.multiply({ a: 1, b: 0, c: 0, d: 1, e: x, f: y });
    },
    scale(this: Matrix, scale: number) {
      return this.multiply({ a: scale, b: 0, c: 0, d: scale, e: 0, f: 0 });
    },
    inverse(this: MatrixValues) {
      const determinant = this.a * this.d - this.b * this.c;
      return createMatrix({
        a: this.d / determinant,
        b: -this.b / determinant,
        c: -this.c / determinant,
        d: this.a / determinant,
        e: (this.c * this.f - this.d * this.e) / determinant,
        f: (this.b * this.e - this.a * this.f) / determinant,
      });
    },
  };
}

function readTransform(element: Element) {
  const numbers = element
    .getAttribute('transform')
    ?.match(/^matrix\(([^)]+)\)$/u)?.[1]
    ?.split(/[ ,]+/u)
    .map(Number);
  return numbers === undefined
    ? null
    : {
        matrix: createMatrix({
          a: numbers[0] ?? 1,
          b: numbers[1] ?? 0,
          c: numbers[2] ?? 0,
          d: numbers[3] ?? 1,
          e: numbers[4] ?? 0,
          f: numbers[5] ?? 0,
        }),
      };
}

// Missing native SVG APIs only. jsdom still has no layout or painting evidence.
export function installDiagramPlatform() {
  Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: () => [] });
  Object.defineProperty(Element.prototype, 'checkVisibility', {
    configurable: true,
    value: () => true,
  });
  Object.defineProperty(globalThis, 'SVGAngle', { configurable: true, value: {} });
  Object.defineProperty(SVGSVGElement.prototype, 'createSVGMatrix', {
    configurable: true,
    value: createMatrix,
  });
  Object.defineProperty(SVGSVGElement.prototype, 'createSVGTransform', {
    configurable: true,
    value: () => ({
      matrix: createMatrix(),
      setMatrix(matrix: Matrix) {
        this.matrix = matrix;
      },
    }),
  });
  Object.defineProperty(SVGElement.prototype, 'transform', {
    configurable: true,
    get(this: Element) {
      return { baseVal: { consolidate: () => readTransform(this) } };
    },
  });
  installSvgGeometry();
  installPointerCapture();
}

function installSvgGeometry() {
  Object.defineProperty(SVGSVGElement.prototype, 'createSVGPoint', {
    configurable: true,
    value: () => ({
      x: 0,
      y: 0,
      matrixTransform(this: { x: number; y: number }, matrix: MatrixValues) {
        return {
          x: matrix.a * this.x + matrix.c * this.y + matrix.e,
          y: matrix.b * this.x + matrix.d * this.y + matrix.f,
        };
      },
    }),
  });
  Object.defineProperty(SVGElement.prototype, 'getScreenCTM', {
    configurable: true,
    value: createMatrix,
  });
  Object.defineProperty(SVGElement.prototype, 'getCTM', {
    configurable: true,
    value: createMatrix,
  });
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 1, height: 1 }),
  });
}

function installPointerCapture() {
  const captured = new WeakMap<Element, Set<number>>();
  Object.defineProperties(Element.prototype, {
    setPointerCapture: {
      configurable: true,
      value(this: Element, pointerId: number) {
        const pointers = captured.get(this) ?? new Set<number>();
        pointers.add(pointerId);
        captured.set(this, pointers);
      },
    },
    releasePointerCapture: {
      configurable: true,
      value(this: Element, pointerId: number) {
        captured.get(this)?.delete(pointerId);
      },
    },
    hasPointerCapture: {
      configurable: true,
      value(this: Element, pointerId: number) {
        return captured.get(this)?.has(pointerId) ?? false;
      },
    },
  });
}
