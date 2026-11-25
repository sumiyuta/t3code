import { EnvironmentId } from "@t3tools/contracts";
import { expect, it, vi } from "vite-plus/test";
import { render } from "../../test/render";
import { ProjectFavicon } from "./ProjectFavicon";

vi.mock(import("../env"), () => ({
  isElectron: false,
  isForkDesktop: true,
  isSecretsFeatureEnabled: false,
}));
vi.mock(import("../state/assets"), () => ({
  projectFaviconUrlAtom: () => {
    throw new Error("Forbidden workspace favicon lookup");
  },
}));

it("does not activate a workspace favicon resource in Fork", async () => {
  await using screen = await render(
    <ProjectFavicon
      project={{
        environmentId: EnvironmentId.make("synthetic"),
        workspaceRoot: "/forbidden/synthetic-project",
        title: "Synthetic",
        faviconPath: "forbidden.svg",
        projectIcon: null,
      }}
    />,
  );
  expect(screen.container.querySelector("img")).toBeNull();
});
