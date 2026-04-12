# AgenticCMS

Headless CMS designed for **agentic workflows**. Built for AI agents, automations, and human-in-the-loop content management.

> **Core principle:** Your Git repository is the database. Every change is versioned, traceable, and triggerable.

## 🎯 Why AgenticCMS?

Traditional CMS are built for humans. AgenticCMS is built for **agents** — both human and AI:

- **AI writes content** → commits to Git
- **AI reviews changes** → PR with diff
- **Human approves** → merge triggers deployment
- **Full audit trail** → who/what/when in Git history

## ✨ Killer Features

| Feature | Description |
|---------|-------------|
| **🔒 Git-Native** | No database. Content = JSON files in Git |
| **🤖 Agent-Ready API** | REST API designed for LLM agents |
| **📝 Structured + Unstructured** | Schema validation + free-form JSON editing |
| **🖼️ Media with Context** | Images + captions + AI-generated alt text |
| **⚡ Event-Driven** | Webhooks on every change |
| **🔄 GitOps Workflow** | Branch → Review → Merge → Deploy |
| **👥 Human-in-the-Loop** | UI for approval, agents for generation |

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/yourusername/agentic-cms.git
cd agentic-cms

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit: GITHUB_PAT, GITHUB_REPO, CMS_ADMIN_USER, CMS_ADMIN_PASSWORD

# 4. Run locally
npm run dev

# 5. Open http://localhost:3000/admin
```

## 📋 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_PAT` | ✅ | GitHub Personal Access Token (repo scope) |
| `GITHUB_REPO` | ✅ | Repository: `username/repo` |
| `GITHUB_BRANCH` | ❌ | Target branch (default: `main`) |
| `CMS_ADMIN_USER` | ✅ | Basic auth username |
| `CMS_ADMIN_PASSWORD` | ✅ | Basic auth password |
| `CMS_CONTENT_DIR` | ❌ | Content folder (default: `content`) |
| `CMS_ASSETS_DIR` | ❌ | Assets folder (default: `public/assets`) |

## 🎭 Usage Modes

### 1. Human Mode (Web UI)
Visit `/admin` — structured forms for editing content.

### 2. Agent Mode (API)
```bash
# List content
curl /api/content

# Get item
curl /api/content/post-1

# Save (authenticated)
curl -X POST /api/save-content \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d '{"path": "content/post-1.json", "content": {...}}'
```

### 3. Hybrid Mode
AI generates draft → Human reviews in UI → Approves → Auto-deploy.

## 🗺️ Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed development plan.

### Phase 1: Foundation ✅
- [x] Basic CRUD via UI
- [x] GitHub integration
- [x] Image uploads
- [x] Basic auth

### Phase 2: Agentic Core
- [ ] Agent API tokens (separate from human auth)
- [ ] Schema validation (Zod)
- [ ] Webhooks system
- [ ] Content diff viewer
- [ ] Branch management (drafts)

### Phase 3: AI Integration
- [ ] OpenAI/Anthropic plugin
- [ ] Auto-generate content from prompts
- [ ] AI review suggestions
- [ ] Semantic search (embeddings)

### Phase 4: Collaboration
- [ ] Multi-user with roles
- [ ] Approval workflows
- [ ] Comments on changes
- [ ] Real-time sync

### Phase 5: Ecosystem
- [ ] CLI tool
- [ ] VS Code extension
- [ ] Mobile app
- [ ] Marketplace (plugins)

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Human UI  │     │  Agent API   │     │   Webhooks  │
│   (/admin)  │     │  (/api/*)    │     │  (events)   │
└──────┬──────┘     └──────┬───────┘     └──────┬──────┘
       │                   │                    │
       └───────────────────┼────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Next.js API Routes    │
              │  (serverless functions) │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │     GitHub API          │
              │  (content + assets)     │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │    Git Repository       │
              │   (source of truth)     │
              └─────────────────────────┘
```

## 🤝 Contributing

AgenticCMS is designed as a foundation. The vision is **CMS as a platform for agentic workflows**.

Want to contribute? Check [ROADMAP.md](./ROADMAP.md) for priority tasks.

## 📄 License

MIT — use it, fork it, build your own CMS empire.

---

**Built with:** Next.js + GitHub API + Vision of agentic future 🚀
