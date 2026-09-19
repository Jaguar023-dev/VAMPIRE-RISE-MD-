import pino from 'pino';
import chalk from 'chalk';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
  },
}).child({ bot: 'VAMPIRE-RISE-MD' });

export const banner = (msg: string) =>
  console.log(chalk.red.bold(`\n🩸 ${msg}\n`));