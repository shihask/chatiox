export const config = {
  apiUrl: import.meta.env.VITE_API_BASE_URL as string,
  environment: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  metaAppId: import.meta.env.VITE_META_APP_ID as string | undefined,
  metaEmbeddedSignupConfigId: import.meta.env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID as string | undefined,
}
