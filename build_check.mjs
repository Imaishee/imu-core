import { execSync } from 'child_process';
const result = execSync('npx next build 2>&1', { encoding: 'utf8', maxBuffer: 1024*1024 });
console.log(result.slice(-2000));
