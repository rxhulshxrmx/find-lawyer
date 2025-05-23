import { env } from "@/lib/env.mjs";

export const getDbConfig = (appName: string = 'find_lawyer_app') => ({
  connectionString: env.DATABASE_URL,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 20,
  max_lifetime: 60 * 30,
  ssl: { require: true },
  prepare: false,
  connection: {
    application_name: appName,
    options: '-c prefer_ipv4=true',
  },
  onnotice: () => {},
  debug: (connection_id: string, str: string, args: any[]) => {
    if (str.includes('error')) {
      console.error(`DB Debug [${connection_id}]:`, str, args);
    }
  },
});

// For node-postgres Client
export const getNodePgConfig = (appName: string = 'find_lawyer_app') => ({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  application_name: appName,
  connectionTimeoutMillis: 20000,
  statement_timeout: 30000,
  query_timeout: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
}); 