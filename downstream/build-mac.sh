#!/bin/bash
set -eu
if [[ $# -gt 1 ]]; then echo "Usage: $0 [output-directory]" >&2; exit 2; fi
cd "$(dirname "$0")/.."
source_commit=$(git rev-parse HEAD)
check_source() {
  local current dirty
  current=$(git rev-parse HEAD)
  dirty=$(git status --porcelain --untracked-files=normal)
  if [[ "$current" != "$source_commit" || -n "$dirty" ]]; then
    echo "Release builds require a clean checkout at the starting commit." >&2
    exit 1
  fi
}
check_source
read -r tag base < downstream/upstream.lock
git merge-base --is-ancestor "$base" HEAD
test "$(git rev-parse "refs/tags/$tag^{commit}")" = "$base"
# Only the four public client settings from the upstream example are build inputs.
# Do not execute the example as a shell script or copy user configuration.
for key in T3CODE_CLERK_PUBLISHABLE_KEY T3CODE_CLERK_JWT_TEMPLATE T3CODE_CLERK_CLI_OAUTH_CLIENT_ID T3CODE_RELAY_URL; do
  value=$(sed -n "s/^$key=//p" .env.example)
  test -n "$value" || { echo "Missing public build setting: $key" >&2; exit 1; }
  export "$key=$value"
done
unset GITHUB_REPOSITORY T3CODE_DESKTOP_UPDATE_REPOSITORY T3CODE_DESKTOP_MOCK_UPDATES
export T3CODE_TELEMETRY_ENABLED=false
export T3CODE_DESKTOP_SIGNED=false
export T3CODE_DESKTOP_VERSION="${tag#v}"
corepack pnpm install --frozen-lockfile
output_dir=${1:-release}
corepack pnpm exec node scripts/build-desktop-artifact.ts --platform mac --arch arm64 --target dir --output-dir "$output_dir"
shopt -s nullglob
apps=("$output_dir"/mac-arm64/*.app)
if [[ ${#apps[@]} -ne 1 ]]; then echo "Expected one arm64 app in $output_dir" >&2; exit 1; fi
app=${apps[0]}
if [[ -e "$app/Contents/Resources/app-update.yml" ]]; then echo "Unexpected Electron update feed" >&2; exit 1; fi
executable=$(/usr/libexec/PlistBuddy -c "Print :CFBundleExecutable" "$app/Contents/Info.plist")
ELECTRON_RUN_AS_NODE=1 "$app/Contents/MacOS/$executable" -e '
  const [file, version, commit] = process.argv.slice(1);
  const metadata = require(require("node:path").resolve(file));
  if (metadata.version !== version || metadata.t3codeCommitHash !== commit) {
    throw new Error("Packaged version or commit differs from the reviewed source");
  }
' "$app/Contents/Resources/app.asar/package.json" "${tag#v}" "$(git rev-parse --short=12 "$source_commit")"
check_source
# The unsigned upstream directory build retains Electron's unsealed executable signature.
# Seal the complete private bundle locally before verifying or launching it.
/usr/bin/codesign --force --deep --sign - "$app"
/usr/bin/codesign --verify --deep --strict "$app"
