// PM2 Ecosystem File
// Para deployment en producción con PM2

module.exports = {
  apps: [
    {
      // Backend API
      name: 'zaiken-backend',
      cwd: './backend',
      script: 'dist/src/main.js',
      instances: 1,
      exec_mode: 'cluster',

      // Variables de entorno
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Auto-restart
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // Logs
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Merge logs de todas las instancias
      merge_logs: true,

      // Reintentos
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 5000,
      kill_timeout: 5000,

      // Post-deployment hooks
      post_update: ['npm install', 'npm run build'],
    },

    // Frontend (si se sirve con PM2)
    {
      name: 'zaiken-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      merge_logs: true,
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'tu-servidor.com',
      ref: 'origin/main',
      repo: 'git@github.com:tu-usuario/zaiken-system.git',
      path: '/var/www/zaiken-system',

      'pre-deploy-local': '',
      'post-deploy': 'cd backend && bash scripts/deploy.sh && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
