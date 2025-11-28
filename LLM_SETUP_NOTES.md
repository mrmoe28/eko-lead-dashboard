# LLM Setup Notes - Self-Hosted API for Vercel Dashboard

**Date:** 2025-11-27
**Project:** eko-lead-dashboard
**Goal:** Use self-hosted LLMs on Mini-PC as OpenAI/Perplexity replacement in Vercel app

---

## Hardware Setup

### Current Configuration
- **Development Machine:** Mac (this machine)
- **Build/Deploy Server:** Mac Mini (8GB RAM) - for building and deploying
- **Model Inference Server:** Mini-PC (34GB RAM) - for running LLMs (heavy lifting)
- **Model Storage:** External Drive `MrMoe28Hub_Main` (67GB of models)

---

## LLM Inventory (External Drive: MrMoe28Hub_Main)

### Total Storage: ~67GB of Models

#### Ollama Models (18GB) - `/Volumes/MrMoe28Hub_Main/OllamaModels/`
**Installed models:**
- `dolphin-llama3`
- `gemma3`
- `mario`
- `minimax-m2`
- `my-ai` (custom)
- `pam` / `pam-native` (custom)
- `qwen2.5`
- `qwen2.5-coder`
- `qwen3`
- `lmstudio-community/Qwen3-VL-4B-Instruct-MLX-4bit`

**Local symlink:** `~/.ollama/models` → `/Volumes/MrMoe28Hub_Main/OllamaModels`

#### HuggingFace Models (14GB) - `/Volumes/MrMoe28Hub_Main/HF_CACHE/`
- Qwen 2.5-7B-Instruct
- Qwen 2.5-1.5B-Instruct
- Qwen 2.5-Coder-7B-Instruct
- Qwen 2.5-3B-Instruct (4-bit)
- Llama-3.2-1B-Instruct (4-bit)
- TinyLlama-1.1B-Chat
- sentence-transformers/all-MiniLM-L6-v2 (embeddings)

#### Local Models (12GB) - `/Volumes/MrMoe28Hub_Main/Models/`
- Qwen2.5-Coder-7B-Instruct (fp16 & 4-bit)
- Llama-3.2-1B-Instruct-4bit
- TinyLlama-1.1B-Chat
- DeepSeek-Coder 1.5B
- DeepSeek-R1 1.5B
- Gemma3 (270M & 1B)
- Granite4 (350M)
- StarCoder2-7B (4-bit)

#### LLM Backups (23GB) - `/Volumes/MrMoe28Hub_Main/LLM_Models/`
(Backup copies from LM Studio and llama-cpp)

#### Existing Projects on External Drive
- `/Volumes/MrMoe28Hub_Main/Projects/open-webui` - Web UI for LLMs (has API key management)
- `/Volumes/MrMoe28Hub_Main/Projects/qwen-chat` - Custom Qwen chat interface
- `/Volumes/MrMoe28Hub_Main/mac-mini-server-project` - Server configs with Ollama setup

---

## Proposed Architecture

```
External Drive (Models)
        ↓
Mini-PC (34GB RAM)
        ↓
Chat Interface (open-webui or qwen-chat)
        ↓
API Key Generation System
        ↓
Cloudflare Tunnel / ngrok (secure public access)
        ↓
Vercel Dashboard App (replaces OpenAI/Perplexity)
```

---

## Outstanding Questions (NEED ANSWERS)

1. **Mini-PC Operating System:**
   - What OS is the Mini-PC running? (Windows Server? Linux? Other?)
   - Found folder hint: `/Volumes/MrMoe28Hub_Main/mac-mini-server-project/windows-server`

2. **Network Access:**
   - Can you access the Mini-PC from this Mac? (SSH, RDP, network share?)
   - What's the Mini-PC's IP or hostname?
   - Same local network or remote?

3. **External Drive Location:**
   - Where is `MrMoe28Hub_Main` currently connected?
     - [ ] This Mac
     - [ ] Mini-PC
     - [ ] Mac Mini
     - [ ] Can be moved

4. **Chat Interface Preference:**
   - Which do you want to use for API key generation?
     - [ ] **Open-WebUI** (has built-in API key management)
     - [ ] **Qwen-Chat** (custom interface)
     - [ ] Set up new one

---

## Next Steps (Once Questions Answered)

### Phase 1: Mini-PC Setup
1. Connect external drive to Mini-PC
2. Install/configure Ollama on Mini-PC
3. Point Ollama to external drive models
4. Test model loading with 34GB RAM

### Phase 2: Chat Interface Deployment
1. Deploy chosen chat interface (open-webui or qwen-chat) on Mini-PC
2. Configure API key generation system
3. Set up user authentication
4. Test API endpoints locally

### Phase 3: Public Access
1. Install Cloudflare Tunnel or ngrok on Mini-PC
2. Expose chat interface API to internet
3. Configure security (rate limiting, API key validation)
4. Test from external network

### Phase 4: Vercel Integration
1. Add Mini-PC API endpoint to Vercel environment variables
2. Update Vercel app code to use self-hosted API
3. Add API key to Vercel secrets
4. Replace OpenAI/Perplexity calls with local API
5. Deploy and test

---

## Benefits of This Setup

✅ **Pros:**
- Free (no OpenAI/Perplexity API costs)
- Full control over models and data
- Privacy (data stays on your hardware)
- 34GB RAM perfect for 7B models
- OpenAI-compatible API format
- Can run multiple models simultaneously

❌ **Cons:**
- Mini-PC must stay running 24/7
- External drive must stay connected
- Slower than cloud APIs (network latency)
- No auto-scaling (single instance)
- You manage uptime/monitoring

---

## Recommended Models for Production

### For Code Generation (Replace OpenAI):
- **qwen2.5-coder** (best for code, 7B fits in 34GB RAM)
- **deepseek-coder** (fast, specialized)

### For General Chat:
- **qwen2.5** (balanced, good reasoning)
- **gemma3** (faster, lighter)

### For Search/Research (Replace Perplexity):
- Combine **qwen2.5** with RAG (retrieval augmented generation)
- Use embeddings: `sentence-transformers/all-MiniLM-L6-v2`

---

## Files to Create Next

1. **Mini-PC setup script** (once we know the OS)
2. **Cloudflare Tunnel config**
3. **API wrapper for Vercel** (TypeScript)
4. **Environment variable template**
5. **Monitoring/health check endpoint**

---

## Notes

- Symlink trick saves internal SSD space by storing models on external drive
- Open-WebUI is recommended (has mature API key system built-in)
- Cloudflare Tunnel is free and more reliable than ngrok free tier
- With 34GB RAM, can run Qwen2.5-7B-Instruct comfortably
- Consider setting up automatic model switching based on task type

---

## Contact Points for Session Restart

**To resume this conversation, tell Claude:**
"Read `LLM_SETUP_NOTES.md` and continue the Mini-PC LLM setup. We need to answer the outstanding questions in the 'NEED ANSWERS' section."

**Key context preserved in:**
- This file: `LLM_SETUP_NOTES.md`
- Project: `/Users/ekodevapps/Desktop/ekoleadgenerator/eko-lead-dashboard`
- Models: `/Volumes/MrMoe28Hub_Main/OllamaModels` (and other model directories)
