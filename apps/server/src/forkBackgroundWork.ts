import * as HostProcess from "@t3tools/shared/HostProcess";
import * as Effect from "effect/Effect";

/** Imported history must not inspect or resume its original workspaces on boot. */
export const startBackgroundWorkspaceWork = Effect.fn("ForkBackgroundWork.start")(function* <
  A,
  E,
  R,
>(work: Effect.Effect<A, E, R>) {
  if ((yield* HostProcess.Environment).T3CODE_FORK_PROJECT_ENRICHMENT_ENABLED === "false") return;
  yield* work;
});
