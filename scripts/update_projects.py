#!/usr/bin/env python3

"""Generate assets/data/projects.json using GitHub GraphQL pinned repositories.

This script is used by the GitHub Actions workflow and can also be run locally
(if you provide a token via env var GH_TOKEN).

Env:
  GH_TOKEN  - GitHub token with access to GraphQL API (required)
  USERNAME  - GitHub username (default: arnold-abraham)
  OUTFILE   - Output JSON file (default: assets/data/projects.json)

"""

from __future__ import annotations

import datetime as _dt
import json
import os
import subprocess
import sys


def main() -> int:
    token = os.environ.get("GH_TOKEN")
    if not token:
        print("GH_TOKEN env var is required", file=sys.stderr)
        return 2

    username = os.environ.get("USERNAME", "arnold-abraham")
    outfile = os.environ.get("OUTFILE", "assets/data/projects.json")

    query = """query($login: String!) {
  user(login: $login) {
    pinnedItems(first: 6, types: [REPOSITORY]) {
      nodes {
        ... on Repository {
          name
          description
          url
          stargazerCount
          forkCount
          primaryLanguage { name }
        }
      }
    }
  }
}"""

    payload = {"query": query, "variables": {"login": username}}

    proc = subprocess.run(
        [
            "curl",
            "-sS",
            "-H",
            f"Authorization: Bearer {token}",
            "-H",
            "Content-Type: application/json",
            "-d",
            json.dumps(payload),
            "https://api.github.com/graphql",
        ],
        check=True,
        capture_output=True,
        text=True,
    )

    resp = json.loads(proc.stdout or "{}")
    if "errors" in resp:
        print(json.dumps(resp["errors"], indent=2), file=sys.stderr)
        return 1

    nodes = (
        (((resp.get("data") or {}).get("user") or {}).get("pinnedItems") or {}).get("nodes")
        or []
    )

    projects = []
    for n in nodes:
        if not n:
            continue
        projects.append(
            {
                "name": n.get("name"),
                "description": n.get("description"),
                "url": n.get("url"),
                "stars": n.get("stargazerCount", 0),
                "forks": n.get("forkCount", 0),
                "language": ((n.get("primaryLanguage") or {}) or {}).get("name"),
            }
        )

    out = {
        "generatedAt": _dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "username": username,
        "projects": projects,
    }

    os.makedirs(os.path.dirname(outfile), exist_ok=True)
    with open(outfile, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(projects)} pinned projects to {outfile}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
