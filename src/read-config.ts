import { join } from "path";

export type SolidRegisterConfiguration = {
  compile?: {
    /** configure solid configuration */
    solid?:
      | boolean
      | { engine: "solid"; extensions?: string[] }
      | { engine: "ts-node" }
      | { engine: "babel"; extensions: string[] };
    /** switch off css (modules) compilation */
    css?: boolean;
    assets?:
      | {
          /** an array with the extensions string of the files that should return an asset path, i.e. `['.svg', '.csv']` */
          extensions: string[];
        }
      | boolean;
  };
  /** which DOM implementation should be registered and what URL should be used (default: jsdom and https://localhost:3000) */
  dom?:
    | "jsdom"
    | "happy-dom"
    | "linkedom"
    | { engine: "jsdom" | "happy-dom" | "linkedom"; url?: string }
    | false;
  /** setup filename aliasing for running browser/dev/server versions of solid or mocks */
  aliases?: {
    /**
     * an object containing find-Expressions that will be used as `RegExp` and the value as a replace string,
     * @example ```ts
     * "filenames": { "my-dependency": "my-dependency/mock" }
     * ```
     * You can also use replace groups and other `RegExp` features
     */
    filenames?: { [find: string]: string };
    /**
     * The extensions for which the aliases should be applied, including the dot; default is `['.js', '.jsx', '.ts', '.tsx']`
     */
    extensions?: string[];
    /**
     * A shorthand to mock the resolution of solid environments, default is `'dev'`
     *
     * You can alternatively run your testing with `node --conditions browser [testing script]`; in this case, the solid aliases will not be applied
     */
    solid?: "server" | "dev" | "browser";
  };
  /** files you want to run to setup your environment */
  setupFiles?: string[];
};

const config: SolidRegisterConfiguration = {
  dom: "jsdom",
  aliases: { solid: "dev" },
};

const getPackageJson = () => {
  let path = process.cwd();
  while (path) {
    try {
      const packageJson = require(join(path, "package.json"));
      return [packageJson, path];
    } catch (e) {
      /* package.json not loaded */
    }
    path = path.replace(/[\/\\][^/\\]+$/, "");
  }
  console.warn(
    "\x1b[33m⚠️ package.json could not be found; maybe you're not in a project?\x1b[0m"
  );
  return [{}, "./"];
};

const [packageJson, projectPath] = getPackageJson();

Object.assign(config, packageJson?.["solid-register"]);

try {
  Object.assign(config, require(join(projectPath, "solid-register-config")));
} catch (e: any) {
  if ("code" in e && e.code !== "MODULE_NOT_FOUND") {
    if (e instanceof Error) {
      throw e;
    }
  }
}

export { config };
