// @effect-diagnostics nodeBuiltinImport:off - Boot isolation runs before an Effect runtime exists.
import * as NodePath from "node:path";

export function sumiyaEnvironment(
  inherited: NodeJS.ProcessEnv,
  ownerHome: string,
): NodeJS.ProcessEnv {
  const home = NodePath.join(ownerHome, ".t3-sumiya-home");
  const environment: NodeJS.ProcessEnv = {};
  for (const key of ["TMPDIR", "LANG", "LC_CTYPE", "__CF_USER_TEXT_ENCODING"]) {
    if (inherited[key] !== undefined) environment[key] = inherited[key];
  }
  return {
    ...environment,
    HOME: home,
    ZDOTDIR: home,
    PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
    CODEX_HOME: NodePath.join(home, ".codex"),
    CLAUDE_CONFIG_DIR: NodePath.join(home, ".claude"),
    T3CODE_HOME: NodePath.join(home, "t3"),
    T3CODE_PORT: "4774",
    T3CODE_TELEMETRY_ENABLED: "false",
    T3CODE_OTEL_SDK_DISABLED: "true",
    OTEL_SDK_DISABLED: "true",
    T3CODE_DISABLE_AUTO_UPDATE: "true",
  };
}
