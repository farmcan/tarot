// Existing Tarot content initializers use these ES2019 helpers. The isolated
// mini-tool build targets Chrome 61; keep the compatibility scope explicit.
if (!Object.fromEntries) {
  Object.defineProperty(Object, 'fromEntries', {
    configurable: true, writable: true,
    value(entries: Iterable<readonly [PropertyKey, unknown]>) {
      const result: Record<PropertyKey, unknown> = {};
      for (const [key, value] of entries) {
        Object.defineProperty(result, key, { configurable: true, enumerable: true, writable: true, value });
      }
      return result;
    },
  });
}
if (!Array.prototype.flatMap) {
  Object.defineProperty(Array.prototype, 'flatMap', {
    configurable: true, writable: true,
    value<T, U>(this: T[], callback: (value: T, index: number, array: T[]) => U | U[], thisArg?: unknown) {
      const result: U[] = [];
      this.forEach((value, index, array) => {
        const mapped = callback.call(thisArg, value, index, array);
        if (Array.isArray(mapped)) mapped.forEach((item) => result.push(item));
        else result.push(mapped);
      });
      return result;
    },
  });
}
