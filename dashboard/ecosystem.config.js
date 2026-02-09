module.exports = {
  apps: [{
    name: 'cto-checklist-dashboard-dev',
    script: 'npm',
    args: 'run dev -- -p 6555',
    watch: false,  // Next.js has its own watch
    env: {
      NODE_ENV: 'development',
      PORT: 6555
    }
  }]
};
