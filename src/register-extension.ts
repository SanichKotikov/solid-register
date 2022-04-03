import { readFileSync } from "fs";
import { solidAliasing } from "./compile-aliases";

export type Compiler = (
  this: NodeJS.Module,
  code: string,
  filename: string
) => string;

type LoaderModule = NodeJS.Module & { _compile: Compiler };

const registeredCompilers: Record<string, Compiler[]> = {};

export const registerCompiler = (extension: string, compiler: Compiler) => {
  if (!(extension in registeredCompilers)) {
    registeredCompilers[extension] = [];
  }
  registeredCompilers[extension].push(compiler);
};

const originalLoader = require.extensions[".js"];
const loadModule = (module: LoaderModule, filename: string) => {
  try {
    originalLoader(module, filename);
  } catch (error: any) {
    if (error && error.code) {
      if (error.code === "ERR_REQUIRE_ESM") {
        try {
          const code = readFileSync(filename, "utf-8");
          return module._compile(code, filename);
        } catch (e) {
          throw e ?? error;
        }
      }
    }
    throw error ?? new Error(`error when compiling ${filename}`);
  }
};

const registerExtension = (extension: string | string[]) => {
  if (Array.isArray(extension)) {
    extension.forEach((ext) => registerExtension(ext));
  } else {
    require.extensions[extension] = (
      module: NodeJS.Module,
      filename: string
    ) => {
      const oldname = filename;
      filename = solidAliasing(filename);
      if (registeredCompilers[extension]) {
        const mod = module as LoaderModule;
        const modCompile = mod._compile.bind(mod);
        mod._compile = (code) =>
          modCompile(
            registeredCompilers[extension].reduce(
              (code, compiler) => compiler.call(module, code, filename),
              code
            ),
            code
          );
        loadModule(mod, filename);
      } else {
        loadModule(module as LoaderModule, filename);
      }
    };
  }
};

export const init = () => {
  registerExtension(Object.keys(registeredCompilers));
  if (!registeredCompilers[".cjs"]) {
    registerExtension(".cjs");
  }
};
