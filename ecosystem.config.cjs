module.exports = {
  apps: [
    {
      name: 'gold-terminal',
      script: 'server.js',
      cwd: 'D:\\US DATA\\server',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: '5000',
        PATH: 'C:\\Program Files\\nodejs;' + process.env.PATH,
        // env vars are loaded from D:\US DATA\.env by dotenv inside server.js
      },
      watch: false,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      error_file: 'D:\\US DATA\\logs\\pm2-error.log',
      out_file:   'D:\\US DATA\\logs\\pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    }
  ]
};
