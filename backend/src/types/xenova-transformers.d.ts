// Type shim for @xenova/transformers — the package ships CJS types incompatible
// with moduleResolution: NodeNext. All usages are already typed as `any`.
declare module '@xenova/transformers' {
  export function pipeline(task: string, model: string, options?: Record<string, unknown>): Promise<any>;
}
