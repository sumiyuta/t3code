const { forkEnvironment } = require("./forkEnvironment.cjs");
const environment = forkEnvironment(process.env, require("node:os").userInfo().homedir);
for (const key of Object.keys(process.env)) delete process.env[key];
Object.assign(process.env, environment);
for (const directory of [
  environment.T3CODE_HOME,
  environment.T3CODE_DESKTOP_APP_DATA_DIR,
  environment.CODEX_HOME,
  environment.CLAUDE_CONFIG_DIR,
]) {
  require("node:fs").mkdirSync(directory, { recursive: true, mode: 0o700 });
}
require("./compileCache.cjs");
require("./main.cjs");
