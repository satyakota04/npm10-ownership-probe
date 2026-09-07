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
  npmExecPath: process.env.npm_execpath,
  uid: process.getuid(),
  gid: process.getgid(),
  groups: process.getgroups(),
  cwd: process.cwd(),
  workspace: stat(path.dirname(process.cwd())),
  app: stat(process.cwd()),
  nodeModules: stat(path.dirname(target)),
  lock: stat(target)
}));

try {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, String(process.pid), { flag: 'wx' });
  try {
    console.log('LOCK_WRITE_OK ' + JSON.stringify({ lock: stat(target) }));
    const payload = path.join(path.dirname(target), 'ownership-probe.txt');
    if (!fs.existsSync(payload)) fs.writeFileSync(payload, 'Synthetic cache payload.\n', { flag: 'wx' });
  } finally {
    fs.unlinkSync(target);
  }
  console.log('LOCK_RELEASED');
} catch (error) {
  console.error('LOCK_WRITE_ERROR ' + JSON.stringify({ code: error.code, message: error.message, target, errorPath: error.path }));
  process.exitCode = 1;
}
