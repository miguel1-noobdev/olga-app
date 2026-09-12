const { PM2_CWD, PM2_NODE_BIN } = process.env;

if (!PM2_NODE_BIN?.startsWith('/') || !PM2_CWD?.startsWith('/')) {
  throw new Error('PM2_NODE_BIN and PM2_CWD must be absolute paths.');
}

module.exports = {
  apps: [
    {
      name: 'botanica-ob',
      cwd: PM2_CWD,
      interpreter: PM2_NODE_BIN,
      script: 'node_modules/next/dist/bin/next',
      args: 'start --hostname 127.0.0.1',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
