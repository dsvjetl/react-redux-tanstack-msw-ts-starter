const getEnvVar = (envVar: string) => (import.meta as any).env[envVar];

export { getEnvVar };
