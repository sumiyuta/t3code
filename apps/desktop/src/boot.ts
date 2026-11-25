const { sumiyaEnvironment } = require("./sumiyaEnvironment.cjs");
const environment = sumiyaEnvironment(process.env, require("node:os").homedir());
for (const key of Object.keys(process.env)) delete process.env[key];
Object.assign(process.env, environment);
for (const directory of [environment.HOME, environment.CODEX_HOME, environment.CLAUDE_CONFIG_DIR]) {
  require("node:fs").mkdirSync(directory, { recursive: true, mode: 0o700 });
}
require("./compileCache.cjs");
require("./main.cjs");
