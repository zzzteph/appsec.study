#!/usr/bin/env bash
# Full mutie verification gate. Run from vms/mutie:  bash tools/verify.sh [N]
# 1) builds the Docker image (mandatory), 2) runs the engine invariant INSIDE the image,
# 3) boots a container and blind-solves N fresh mutations to RCE over HTTP.
# The container MUST be named "mu" (blind_solve.py restarts "mu" between iterations).
set -euo pipefail
cd "$(dirname "$0")/.."
N="${1:-40}"

echo "==> [1/3] docker build"
docker build -t mutie .

echo "==> [2/3] engine invariant (inside image)"
docker run --rm mutie node validate.js | grep -Ei "unsolvable|violation|non-reprod|distinct chain|re-valid"

echo "==> [3/3] boot + blind solve ($N fresh mutations)"
docker rm -f mu >/dev/null 2>&1 || true
docker run -d --name mu -p 8092:80 mutie >/dev/null
# wait for readiness (poll /api/manifest) — the solver polls too between restarts
for i in {1..40}; do
  if curl -sf http://127.0.0.1:8092/api/manifest >/dev/null 2>&1; then break; fi
  sleep 0.3
done
python tools/blind_solve.py "$N" | tail -4
docker rm -f mu >/dev/null 2>&1 || true
echo "==> gate complete (require: 0 unsolvable / 0 violations / 0 non-reproducible / N-of-N solved)"
