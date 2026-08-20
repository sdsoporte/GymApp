#!/usr/bin/env bash
set -euo pipefail

# Download and verify the pinned exercises dataset from
# https://github.com/hasaneyldrm/exercises-dataset
#
# Usage:
#   scripts/download-exercises.sh [target-dir]
#
# Environment:
#   MIRROR_URL - optional fallback URL for an internally mirrored tarball.

PINNED_COMMIT="7455efae41b330c265e7cd4b78dfa848e7ce5ebd"
EXPECTED_SHA256="2e674501f44506d4488c3cd41db903322938fb9f758182e759d558c4048f5d0c"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${1:-${REPO_ROOT}/assets/exercises}"
CACHE_DIR="${REPO_ROOT}/.cache/exercises-dataset"
TARBALL="${CACHE_DIR}/exercises-${PINNED_COMMIT}.tar.gz"

GITHUB_URL="https://github.com/hasaneyldrm/exercises-dataset/archive/${PINNED_COMMIT}.tar.gz"
MIRROR_URL="${MIRROR_URL:-}"

mkdir -p "${CACHE_DIR}" "${TARGET_DIR}"

sha256_matches() {
  local file="$1"
  local expected="$2"
  local actual
  actual="$(sha256sum "${file}" | awk '{print $1}')"
  [[ "${actual}" == "${expected}" ]]
}

if [[ -f "${TARBALL}" ]] && sha256_matches "${TARBALL}" "${EXPECTED_SHA256}"; then
  echo "Dataset tarball already cached and verified."
else
  echo "Downloading exercises dataset..."
  if [[ -n "${MIRROR_URL}" ]]; then
    echo "Using mirror: ${MIRROR_URL}"
    curl -fsSL -o "${TARBALL}" "${MIRROR_URL}"
  else
    echo "Using GitHub source: ${GITHUB_URL}"
    curl -fsSL -L -o "${TARBALL}" "${GITHUB_URL}"
  fi

  if ! sha256_matches "${TARBALL}" "${EXPECTED_SHA256}"; then
    echo "ERROR: SHA256 mismatch for dataset tarball" >&2
    rm -f "${TARBALL}"
    exit 1
  fi
fi

echo "Extracting dataset to ${TARGET_DIR}..."
# Remove a previous extraction so the layout is deterministic.
rm -rf "${TARGET_DIR:?}"
mkdir -p "${TARGET_DIR}"

tar -xzf "${TARBALL}" -C "${TARGET_DIR}" --strip-components=1

echo "Dataset ready at ${TARGET_DIR}"
echo "  rows: $(jq -r 'length' "${TARGET_DIR}/data/exercises.json")"
echo "  images: $(find "${TARGET_DIR}/images" -type f | wc -l)"
echo "  videos: $(find "${TARGET_DIR}/videos" -type f | wc -l)"
