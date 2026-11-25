import { assert, it } from "@effect/vitest";
import { forkEnvironment } from "./forkEnvironment.ts";

it("isolates fork data, provider homes, port and telemetry from the owner's environment", () => {
  const environment = forkEnvironment(
    {
      HOME: "/incorrect-shell-home",
      T3CODE_HOME: "/owner/.t3",
      T3CODE_PORT: "3774",
      T3CODE_TELEMETRY_ENABLED: "true",
      OPENAI_API_KEY: "test-only",
      ANTHROPIC_AUTH_TOKEN: "test-only",
      SSH_AUTH_SOCK: "/owner/agent.sock",
      CODEX_HOME: "/owner/.codex",
      PATH: "/owner/bin",
      TMPDIR: "/tmp/test",
    },
    "/owner",
  );
  assert.equal(environment.HOME, "/owner");
  assert.equal(environment.T3CODE_HOME, "/owner/.t3-fork/data");
  assert.equal(environment.CODEX_HOME, "/owner/.t3-fork/provider-home/.codex");
  assert.equal(environment.CLAUDE_CONFIG_DIR, "/owner/.t3-fork/provider-home/.claude");
  assert.equal(environment.T3CODE_FORK_PROVIDER_HOME, "/owner/.t3-fork/provider-home");
  assert.equal(environment.T3CODE_DESKTOP_APP_DATA_DIR, "/owner/.t3-fork/electron");
  assert.equal(environment.T3CODE_PORT, "4874");
  assert.equal(environment.T3CODE_FORK_PROJECT_ENRICHMENT_ENABLED, "false");
  assert.equal(environment.T3CODE_TELEMETRY_ENABLED, "false");
  assert.equal(environment.T3CODE_OTEL_SDK_DISABLED, "true");
  assert.equal(environment.OTEL_SDK_DISABLED, "true");
  assert.equal(environment.TMPDIR, "/tmp/test");
  assert.isUndefined(environment.OPENAI_API_KEY);
  assert.isUndefined(environment.ANTHROPIC_AUTH_TOKEN);
  assert.isUndefined(environment.SSH_AUTH_SOCK);
  assert.notInclude(environment.PATH!, "/owner/bin");
  assert.deepStrictEqual(forkEnvironment(environment, environment.HOME!), environment);
});
