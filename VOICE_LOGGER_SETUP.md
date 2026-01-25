# Baby Buddy Voice Logger Edition - Setup Instructions

This is a custom fork of the Baby Buddy Home Assistant add-on with voice logging built-in.

## What's Different?

✅ Includes voice logger widget pre-installed
✅ Floating microphone button on all Baby Buddy pages
✅ Voice-to-text logging via n8n + OpenAI
✅ Automatic installation on container start

## Changes Made

1. **Widget file added**: `root/app/babybuddy/static/babybuddy/js/voice-logger-widget.js`
2. **Init script added**: `root/etc/cont-init.d/voice-logger.sh` (patches template on startup)
3. **Version updated**: `2.7.1-voice1`
4. **Slug changed**: `baby_buddy_voice` (so it can coexist with original)

## Installation Steps

### 1. Fork This Repository to Your GitHub

1. Go to this repository on GitHub
2. Click **Fork** (top-right)
3. Fork to your personal GitHub account

### 2. Update Configuration with Your GitHub Username

Edit `babybuddy/config.yaml`:
- Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username
- Example: `image: "ghcr.io/trevorduke/babybuddy-voice-{arch}"`

### 3. Build Docker Images (Optional - Only if you want to host images yourself)

If you want to build and host your own Docker images:

```bash
cd babybuddy

# Build for your architecture
docker buildx build \\
  --platform linux/amd64 \\
  -t ghcr.io/YOUR_GITHUB_USERNAME/babybuddy-voice-amd64:2.7.1-voice1 \\
  -f Dockerfile \\
  .

# Push to GitHub Container Registry
docker push ghcr.io/YOUR_GITHUB_USERNAME/babybuddy-voice-amd64:2.7.1-voice1
```

**OR** use local builds (simpler):

Edit `babybuddy/config.yaml` and change:
```yaml
image: "ghcr.io/YOUR_GITHUB_USERNAME/babybuddy-voice-{arch}"
```

To:
```yaml
# Use local builds instead
# Leave blank or use: "local/baby_buddy_voice"
```

### 4. Commit and Push to Your Fork

```bash
git add .
git commit -m "Add voice logger widget"
git push origin main
```

### 5. Add Repository to Home Assistant

1. In Home Assistant: **Settings** → **Add-ons** → **Add-on Store** (click 3 dots menu)
2. Click **Repositories**
3. Add: `https://github.com/YOUR_GITHUB_USERNAME/addon-babybuddy`
4. Click **Add**

### 6. Install Your Custom Add-on

1. Refresh the Add-on Store
2. Look for **"Baby Buddy (Voice Logger Edition)"**
3. Click it and click **Install**
4. Configure it with your settings (copy from current Baby Buddy)
5. Start the add-on

### 7. Remove Old Baby Buddy (Optional)

Once the new one is working:
1. Stop the old Baby Buddy add-on
2. Optionally uninstall it
3. The new voice logger edition will take over

## Configuration

The voice logger webhook URL is hardcoded to:
```
https://n8n.trevorduke.com/webhook/baby-buddy-audio
```

To change it, edit `root/etc/cont-init.d/voice-logger.sh` before building.

## Upgrading Baby Buddy Version

When a new Baby Buddy version is released:

1. Edit `babybuddy/Dockerfile` line 14:
   ```dockerfile
   "https://github.com/babybuddy/babybuddy/archive/refs/tags/vNEW_VERSION.tar.gz"
   ```

2. Update `babybuddy/config.yaml`:
   ```yaml
   version: NEW_VERSION-voice1
   ```

3. Commit, push, and rebuild

## Troubleshooting

**Widget doesn't appear:**
- Check browser console for errors (F12)
- Verify init script ran: `docker logs addon_XXX_baby_buddy_voice | grep "Voice Logger"`

**Template not patched:**
- The init script runs on every container start
- Check logs for errors

**Build fails:**
- Make sure you're using the correct base image
- Check Docker buildx is installed

## Support

This is a custom fork. For:
- **Voice logger issues**: Contact Trevor Duke
- **Baby Buddy issues**: See https://github.com/babybuddy/babybuddy

## License

Same as Baby Buddy (BSD 2-Clause)
