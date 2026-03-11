// Auto-cleanup script: kills any processes holding ports used by this app
// Runs automatically via "prestart" before npm start

import { execSync } from 'child_process';

const ports = [5000, 8000, 5173];

for (const port of ports) {
  try {
    const output = execSync('netstat -ano').toString();
    const lines = output.split('\n').filter(
      l => l.includes(`:${port} `) && l.includes('LISTENING')
    );
    for (const line of lines) {
      const pid = line.trim().split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid) && pid !== '0') {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`[prestart] Freed port ${port} (killed PID ${pid})`);
        } catch {
          // Process may have already exited
        }
      }
    }
  } catch {
    // netstat not available or port not in use — safe to ignore
  }
}
