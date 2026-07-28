module.exports = {
  apps: [
    {
      name: 'botanica-ob',
      cwd: '/srv/botanica-ob/current',
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
