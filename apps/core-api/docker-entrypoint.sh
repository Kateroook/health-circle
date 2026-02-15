#!/bin/sh
set -e

# Fix permissions for the volume
if [ -d "/file-storage" ]; then
    echo "Fixing permissions for /file-storage..."
    chown -R appuser:appgroup /file-storage
fi

# Execute the command as appuser
exec su-exec appuser:appgroup "$@"
