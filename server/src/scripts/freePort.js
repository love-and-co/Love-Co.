const { exec } = require('child_process');
const PORT = parseInt(process.env.PORT, 10) || 5000;
const isWindows = process.platform === 'win32';

const killCmd = isWindows
  ? `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"`
  : `fuser -k ${PORT}/tcp 2>/dev/null || true`;

try {
  exec(killCmd, () => {
    process.exit(0);
  });
} catch (_) {
  process.exit(0);
}
