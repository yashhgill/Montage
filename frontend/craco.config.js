const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  devServer: {
    client: {
      overlay: {
        runtimeErrors: (error) => {
          if (error.message.includes("ResizeObserver loop")) return false;
          return true;
        },
      },
    },
  },
};