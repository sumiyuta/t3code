// @effect-diagnostics nodeBuiltinImport:off - Boot isolation runs before an Effect runtime exists.
import * as NodePath from "node:path";

export function forkEnvironment(
  inherited: NodeJS.ProcessEnv,
  ownerHome: string,
): NodeJS.ProcessEnv {
  const root = NodePath.join(ownerHome, ".t3-fork");
  const home = NodePath.join(root, "provider-home");
  const environment: NodeJS.ProcessEnv = {};
  for (const key of ["TMPDIR", "LANG", "LC_CTYPE", "__CF_USER_TEXT_ENCODING"]) {
    if (inherited[key] !== undefined) environment[key] = inherited[key];
  }
  return {
    ...environment,
    HOME: ownerHome,
    ZDOTDIR: home,
    PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
    CODEX_HOME: NodePath.join(home, ".codex"),
    CLAUDE_CONFIG_DIR: NodePath.join(home, ".claude"),
    T3CODE_FORK_PROVIDER_HOME: home,
    T3CODE_DESKTOP_APP_DATA_DIR: NodePath.join(root, "electron"),
    T3CODE_HOME: NodePath.join(root, "data"),
    T3CODE_PORT: "4874",
    T3CODE_FORK_PROJECT_ENRICHMENT_ENABLED: "false",
    T3CODE_TELEMETRY_ENABLED: "false",
    T3CODE_OTEL_SDK_DISABLED: "true",
    OTEL_SDK_DISABLED: "true",
    T3CODE_DISABLE_AUTO_UPDATE: "true",
  };
}
