const { execSync, spawn } = require('child_process');

const child = spawn('npx', ['next', 'dev', '-p', '3000'], {
  cwd: 'A:\\IMU-CORE',
  detached: true,
  stdio: 'ignore'
});
child.unref();
console.log('PID:', child.pid);
