// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "Nebura Client",
      script: "src/main.js", 
      ignore_watch: ["node_modules", "logs"],
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      exec_mode: "cluster",
    },
  ],
};