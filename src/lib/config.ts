export const config = {
  apiUrl: import.meta.env.VITE_API_BASE_URL as string,
  environment: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}
