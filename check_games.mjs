import fs from 'fs';
import path from 'path';

const gamesDir = path.join(process.cwd(), 'src/components/games');
const files = fs.readdirSync(gamesDir);
files.forEach(f => {
  const content = fs.readFileSync(path.join(gamesDir, f), 'utf8');
  const hasDefault = content.includes('export default');
  const hasUseClient = content.includes('use client');
  console.log(f, 'default:', hasDefault, 'client:', hasUseClient, 'size:', content.length);
});
