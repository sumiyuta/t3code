import { assert, it } from "@effect/vitest";
import { sumiyaEnvironment } from "./sumiyaEnvironment.ts";

it("isolates fork data, provider homes, port and telemetry from the owner's environment", () => {
  const environment = sumiyaEnvironment(
    {
      HOME: "/owner",
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
  assert.equal(environment.HOME, "/owner/.t3-sumiya-home");
  assert.equal(environment.T3CODE_HOME, "/owner/.t3-sumiya-home/t3");
  assert.equal(environment.CODEX_HOME, "/owner/.t3-sumiya-home/.codex");
  assert.equal(environment.CLAUDE_CONFIG_DIR, "/owner/.t3-sumiya-home/.claude");
  assert.equal(environment.T3CODE_PORT, "4774");
  assert.equal(environment.T3CODE_TELEMETRY_ENABLED, "false");
  assert.equal(environment.T3CODE_OTEL_SDK_DISABLED, "true");
  assert.equal(environment.OTEL_SDK_DISABLED, "true");
  assert.equal(environment.TMPDIR, "/tmp/test");
  assert.isUndefined(environment.OPENAI_API_KEY);
  assert.isUndefined(environment.ANTHROPIC_AUTH_TOKEN);
  assert.isUndefined(environment.SSH_AUTH_SOCK);
  assert.notInclude(environment.PATH!, "/owner/bin");
});
