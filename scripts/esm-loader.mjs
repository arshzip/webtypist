// Resolves Vite-style extensionless relative imports so the parser
// can be exercised with plain `node`.
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && !specifier.endsWith(".js")) {
      return next(`${specifier}.js`, context);
    }
    throw err;
  }
}
