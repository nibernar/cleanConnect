/**
 * Empty module mock
 * Used to replace native-only modules when bundling for web
 */

export default null;

// Mock any commonly used exports to prevent undefined errors
export const Commands = {};
export const ViewConfig = {};
export const NativeComponentRegistry = {
  get: () => null,
  setViewConfig: () => null,
};