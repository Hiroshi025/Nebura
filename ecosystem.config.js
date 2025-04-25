module.exports = {
  apps: [
    {
      name: "Nebura Client",
      script: "./Nebura Client/src/main.js",
      watch: true,
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "1G",
      autorestart: true,
      cron_restart: "0 0 * * *",
      ignore_watch: [
        "node_modules",
        "dist",
        "public",
        "logs",
        ".git",
        ".idea",
        ".vscode",
        ".DS_Store",
        "logs-apps",
        "logs-ecosystem",
      ],
    },
  ],
};
