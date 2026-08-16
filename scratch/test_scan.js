const { execSync } = require('child_process');

try {
  const pattern = "((AKIA[0-9A-Z]{16})|(eyJ[a-zA-Z0-9_-]{10,}\\.eyJ[a-zA-Z0-9_-]{10,}\\.[a-zA-Z0-9_-]{10,})|(-----BEGIN (RSA|PRIVATE) KEY-----))";
  const cmd = `grep -rE "${pattern}" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=coverage --exclude=package-lock.json --exclude=*.md --exclude=*.log .`;
  console.log('Running cmd:', cmd);
  const out = execSync(cmd, { encoding: 'utf8' });
  console.log('MATCHES FOUND:\n', out);
} catch (err) {
  if (err.status === 1) {
    console.log('✅ Clean! No secrets or private keys found (grep returned status 1 as expected).');
  } else {
    console.error('Error executing grep:', err.message);
  }
}
