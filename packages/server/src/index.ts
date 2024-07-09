import dotenv from 'dotenv';
dotenv.config();
console.log('Environment Variables:', process.env);

import { parseLogLevel } from '@medplum/core';
import express from 'express';
import gracefulShutdown from 'http-graceful-shutdown';
import { initApp, shutdownApp } from './app';
import { loadConfig } from './config';
import { globalLogger } from './logger';

export async function main(): Promise<void> {
  const configName = process.env.CONFIG_NAME || 'file:medplum.config.json';
  console.log('Using config:', configName);

  process.on('unhandledRejection', (err: any) => {
    console.error('Unhandled promise rejection:', err);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception thrown:', err);

    if (err.message && typeof err.message === 'string' && err.message.includes('Connection terminated unexpectedly')) {
      // The pg-pool library throws this error when the database connection is lost.
      // This can happen when the database server is restarted.
      // We do *not* want to exit the process in this case.
      return;
    }

    process.exit(1);
  });

  globalLogger.info('Starting Medplum Server...', { configName });
  console.log('Starting Medplum Server...', { configName });

  try {
    const config = await loadConfig(configName);
    console.log('Loaded config:', config);

    if (config.logLevel) {
      globalLogger.level = parseLogLevel(config.logLevel);
    }

    console.log('Initializing Express app')
    const app = await initApp(express(), config);
    console.log('Initialized Express app');

    const server = app.listen(config.port, () => {
      console.log(`Server is listening on port ${config.port}`);
      globalLogger.info('Server started', { port: config.port });
    });

    server.keepAliveTimeout = config.keepAliveTimeout ?? 90000;

    gracefulShutdown(server, {
      timeout: config.shutdownTimeoutMilliseconds,
      development: process.env.NODE_ENV !== 'production',
      preShutdown: async (signal) => {
        globalLogger.info(
          `Shutdown signal received... allowing graceful shutdown for up to ${config.shutdownTimeoutMilliseconds} milliseconds`,
          { signal }
        );
        console.log(
          `Shutdown signal received... allowing graceful shutdown for up to ${config.shutdownTimeoutMilliseconds} milliseconds`,
          { signal }
        );
      },
      onShutdown: () => shutdownApp(),
      finally: () => {
        globalLogger.info('Shutdown complete');
        console.log('Shutdown complete');
      },
    });
  } catch (error) {

    console.error('Error during startup:', error);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Failed to start the server:', err);
  });
}
