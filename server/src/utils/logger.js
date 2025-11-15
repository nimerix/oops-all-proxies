const pino = require("pino");
const LOG_PRETTY = process.env.LOG_PRETTY === "true";

const pinoTransport = LOG_PRETTY ? {
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
} : {};

const pinoOptions = {
  level: process.env.LOG_LEVEL || "info",
  formatters: { level(label) {
      return { level: label.toUpperCase() };
    },
  },
  ...pinoTransport,
};

const logger = pino(pinoOptions);

module.exports = logger;