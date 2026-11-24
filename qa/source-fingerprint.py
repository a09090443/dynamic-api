#!/usr/bin/env python3
"""Hash build inputs without Git, credentials, or generated frontend assets."""
import hashlib
import json
from pathlib import Path

ROOTS = ("backend/src/main", "backend/build.gradle", "backend/settings.gradle", "base-jar/src", "base-jar/build.gradle",
         "nextjs-dynamic-api-manager/src", "nextjs-dynamic-api-manager/public",
         "nextjs-dynamic-api-manager/package.json", "nextjs-dynamic-api-manager/package-lock.json",
         "nextjs-dynamic-api-manager/next.config.ts", "nextjs-dynamic-api-manager/next.config.js",
         "nextjs-dynamic-api-manager/next.config.mjs", "nextjs-dynamic-api-manager/tsconfig.json",
         "nextjs-dynamic-api-manager/postcss.config.mjs", "nextjs-dynamic-api-manager/tailwind.config.ts",
         "settings.gradle", "build.gradle", "gradle.properties")

def fingerprint(root=Path(".")):
    files = []
    for item in ROOTS:
        p = root / item
        for f in sorted(p.rglob("*") if p.is_dir() else [p]):
            if not f.is_file() or f.is_symlink():
                continue
            name = f.relative_to(root).as_posix()
            if name.startswith("backend/src/main/resources/static/"):
                continue
            files.append((name, hashlib.sha256(f.read_bytes()).hexdigest()))
    if not any(n.endswith("ServiceSummaryProvider.tsx") for n, _ in files):
        raise ValueError("source inputs missing")
    payload = json.dumps(sorted(files), separators=(",", ":")).encode()
    return {"buildHash": hashlib.sha256(payload).hexdigest(), "files": len(files)}

if __name__ == "__main__":
    print(json.dumps(fingerprint(), separators=(",", ":")))
