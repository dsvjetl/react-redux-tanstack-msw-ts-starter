const getEnvVar = (envVar: string): string | undefined =>
  import.meta.env[envVar] as string | undefined;

export { getEnvVar };
