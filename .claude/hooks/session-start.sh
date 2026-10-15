#!/usr/bin/env bash
# SessionStart: install workspace dependencies and openpyxl (fixture extraction) when missing.
# Never fails the session: a missing network host is reported, not fatal.
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
if [ ! -d node_modules ] || [ pnpm-lock.yaml -nt node_modules/.modules.yaml ]; then
  if ! pnpm install --frozen-lockfile >/tmp/bmg-pnpm-install.log 2>&1; then
    echo "session-start: pnpm install --frozen-lockfile gagal (lihat /tmp/bmg-pnpm-install.log)."
    echo "  SheetJS diunduh dari cdn.sheetjs.com; bila host itu diblokir jaringan sesi, lihat docs/v1/README.md (Untuk Dika)."
  fi
fi
if ! python3 -I -c "import openpyxl, sys; sys.exit(0 if openpyxl.__version__ == '3.1.5' else 1)" 2>/dev/null; then
  pip install --break-system-packages --quiet openpyxl==3.1.5 >/tmp/bmg-pip.log 2>&1 || echo "session-start: pip install openpyxl==3.1.5 gagal (lihat /tmp/bmg-pip.log)"
fi
exit 0
