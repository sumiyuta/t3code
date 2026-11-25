#!/usr/bin/env python3
"""Compare an official stable release with the private main branch's reviewed base."""
import argparse
import fcntl
import json
import os
from pathlib import Path
import re
import subprocess
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
UPSTREAM = 'https://github.com/pingdotgg/t3code'
LATEST = 'https://api.github.com/repos/pingdotgg/t3code/releases/latest'
TAG = re.compile(r'v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)', re.ASCII)


def version(tag):
    match = TAG.fullmatch(tag)
    if not match:
        raise ValueError(f'Expected a stable release tag, got {tag!r}')
    return tuple(map(int, match.groups()))


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args], text=True).strip()


def check(notify, state):
    base_tag, base = git('show', 'refs/heads/main:downstream/upstream.lock').split()
    if not re.fullmatch('[a-f0-9]{40}', base):
        raise ValueError('Invalid reviewed upstream commit')
    base_version = version(base_tag)
    git('merge-base', '--is-ancestor', base, 'refs/heads/main')
    req = Request(LATEST, headers={'User-Agent': 't3code-private-release-check'})
    with urlopen(req, timeout=30) as response:
        release = json.load(response)
    tag = release['tag_name']
    if release['draft'] or release['prerelease'] or version(tag) < base_version:
        raise ValueError('Unexpected latest stable release; inspect the upstream release manually')
    ref = f'refs/tags/{tag}'
    # An existing tag that moves must fail. Never force-fetch a release tag.
    base_ref = f'refs/tags/{base_tag}'
    refs = [base_ref] if ref == base_ref else [base_ref, ref]
    git('fetch', '--atomic', '--quiet', '--no-tags', UPSTREAM + '.git',
        *(f'{item}:{item}' for item in refs))
    if git('rev-parse', '--verify', base_ref + '^{commit}') != base:
        raise ValueError('The upstream release no longer matches the reviewed commit')
    head = git('rev-parse', '--verify', ref + '^{commit}')
    if tag == base_tag:
        if not notify:
            print(f'Up to date: {tag} {base}')
        return
    git('merge-base', '--is-ancestor', base, head)
    message = f'{tag} ({head[:12]}) is ready for review'
    url = f'{UPSTREAM}/compare/{base}...{head}'
    if not notify:
        print(message, url, git('diff', '--shortstat', base, head), sep='\n')
        print(f'Inspect locally: git diff {base} {head}')
        return
    marker = state / 'notified-release'
    key = f'{tag} {base} {head}\n'
    if marker.is_file() and marker.read_text() == key:
        return
    subprocess.run(['/usr/bin/osascript', '-e', 'on run argv', '-e',
                    'display notification (item 1 of argv) with title "T3 Code upstream"',
                    '-e', 'end run', message], check=True)
    pending = marker.with_suffix('.new')
    pending.write_text(key)
    os.replace(pending, marker)
    print(message, url, sep='\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--notify', action='store_true', help='notify locally once per update')
    args = parser.parse_args()
    state = Path(git('rev-parse', '--absolute-git-dir')) / 't3code-updates'
    state.mkdir(exist_ok=True)
    with (state / 'check.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        check(args.notify, state)
