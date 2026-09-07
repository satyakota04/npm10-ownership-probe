const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'node_modules', '.ngcc_lock_file');
const stat = file => {
  try {
    const info = fs.statSync(file);
    return { uid: info.uid, gid: info.gid, mode: (info.mode & 0o777).toString(8) };
  } catch (error) {
    return { error: error.code };
  }
};

console.log('OWNERSHIP_PROBE ' + JSON.stringify({
  node: process.version,
  uid: process.getuid(),
  gid: process.getgid(),
  cwd: process.cwd(),
  app: stat(process.cwd()),
  nodeModules: stat(path.dirname(target)),
  lock: stat(target)
}));

try {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, String(process.pid));
  console.log('LOCK_WRITE_OK ' + JSON.stringify({ lock: stat(target) }));
} catch (error) {
  console.error('LOCK_WRITE_ERROR ' + JSON.stringify({ code: error.code, message: error.message, target }));
  process.exitCode = 1;
}
