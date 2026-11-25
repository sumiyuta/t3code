"""Offline integration checks for the downstream release guards."""
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("release_check", Path(__file__).with_name("check-release.py"))
release = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(release)


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.remote = self.root / "origin.git"
        self.local = self.root / "fork"
        self.git(self.root, "init", "-q", "-b", "main", str(self.remote))
        self.commit(self.remote, "base")
        self.base = self.git(self.remote, "rev-parse", "HEAD")
        self.git(self.remote, "tag", "-a", "v1.0.0", "-m", "reviewed")
        self.git(self.root, "clone", "-q", str(self.remote), str(self.local))
        (self.local / "downstream").mkdir()
        (self.local / "downstream/upstream.lock").write_text(f"v1.0.0 {self.base}\n")
        self.commit(self.local, "pin")
        self.commit(self.remote, "next")
        self.git(self.remote, "tag", "v1.1.0")

    def git(self, cwd, *args):
        return subprocess.check_output(["git", "-c", "user.name=Fixture", "-c",
            "user.email=fixture@example.test", "-c", "commit.gpgSign=false", "-c",
            "tag.gpgSign=false", "-C", str(cwd), *args], text=True).strip()

    def commit(self, cwd, message):
        self.git(cwd, "add", ".")
        self.git(cwd, "commit", "-q", "--allow-empty", "-m", message)

    def check(self, latest):
        payload = json.dumps(dict(tag_name=latest, draft=False, prerelease=False)).encode()
        with patch.object(release, "ROOT", self.local), patch.object(release, "UPSTREAM", str(self.remote)[:-4]), patch.object(release, "urlopen", return_value=io.BytesIO(payload)):
            release.check(False, self.root)

    def test_annotated_base_and_lightweight_candidate(self):
        self.check("v1.0.0")
        self.check("v1.1.0")

    def test_deleted_base_blocks_newer_release(self):
        self.git(self.remote, "tag", "-d", "v1.0.0")
        with self.assertRaises(subprocess.CalledProcessError):
            self.check("v1.1.0")

    def test_moved_base_blocks_newer_release_even_without_cached_tag(self):
        self.git(self.remote, "tag", "-f", "v1.0.0", "HEAD")
        self.git(self.local, "tag", "-d", "v1.0.0")
        with self.assertRaisesRegex(ValueError, "reviewed commit"):
            self.check("v1.1.0")


if __name__ == "__main__":
    unittest.main()
