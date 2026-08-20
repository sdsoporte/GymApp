#!/bin/sh
set -e

MOUNT_DIR="/usr/share/nginx/html/exercises"

if [ ! -d "$MOUNT_DIR" ]; then
  echo "ERROR: assets directory $MOUNT_DIR is not mounted" >&2
  exit 1
fi

exec nginx -g 'daemon off;'
