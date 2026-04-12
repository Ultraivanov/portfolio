# Environment Variables

Create these in your Vercel dashboard (Settings → Environment Variables):

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_PAT` | GitHub Personal Access Token with `repo` scope | ✅ |
| `GITHUB_REPO` | Repository in format `username/repo` | ✅ |
| `GITHUB_BRANCH` | Branch to save to (default: `main`) | ❌ |
| `CMS_ADMIN_USER` | Basic auth username for /admin | ✅ |
| `CMS_ADMIN_PASSWORD` | Basic auth password for /admin | ✅ |
| `CMS_CONTENT_DIR` | Where JSON files stored (default: `content`) | ❌ |
| `CMS_ASSETS_DIR` | Where images uploaded (default: `public/assets`) | ❌ |

## Getting GitHub PAT

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Select scope: ✅ `repo` (Full control of private repositories)
4. Copy token and paste to Vercel
