import { assert, it } from "@effect/vitest";
import * as HostProcess from "@t3tools/shared/HostProcess";
import * as Effect from "effect/Effect";
import { startBackgroundWorkspaceWork } from "./forkBackgroundWork.ts";

it.effect("does not start workspace workers for imported Fork history", () =>
  Effect.gen(function* () {
    let started = false;
    yield* startBackgroundWorkspaceWork(
      Effect.sync(() => {
        started = true;
      }),
    );
    assert.isFalse(started);
  }).pipe(
    Effect.provideService(HostProcess.Environment, {
      T3CODE_FORK_PROJECT_ENRICHMENT_ENABLED: "false",
    }),
  ),
);

it.effect("keeps upstream background behavior when no Fork guard is configured", () =>
  Effect.gen(function* () {
    let started = false;
    yield* startBackgroundWorkspaceWork(
      Effect.sync(() => {
        started = true;
      }),
    );
    assert.isTrue(started);
  }).pipe(Effect.provideService(HostProcess.Environment, {})),
);
