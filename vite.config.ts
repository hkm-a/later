import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const { GITHUB_ACTIONS, GITHUB_REPOSITORY } = loadEnv(mode, '.', '')
  const repositoryName = GITHUB_REPOSITORY?.split('/')[1]
  const base = GITHUB_ACTIONS && repositoryName ? `/${repositoryName}/` : '/'

  return {
    base,
    plugins: [react()],
  }
})
