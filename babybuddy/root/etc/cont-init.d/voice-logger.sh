#!/usr/bin/with-contenv bashio
# ==============================================================================
# Home Assistant Add-on: Baby Buddy
# Patches base template to include voice logger widget
# ==============================================================================

bashio::log.info "Installing Voice Logger widget..."

TEMPLATE_FILE="/app/babybuddy/babybuddy/templates/babybuddy/base.html"

# Check if template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    bashio::log.error "Template file not found: $TEMPLATE_FILE"
    exit 1
fi

# Check if already patched (in case of restart)
if grep -q "VOICE_LOGGER_CONFIG" "$TEMPLATE_FILE"; then
    bashio::log.info "Voice Logger already installed, skipping..."
    exit 0
fi

# Backup original
cp "$TEMPLATE_FILE" "$TEMPLATE_FILE.original"

# Add voice logger script tags before </body>
sed -i 's|</body>|    <!-- Voice Logger Widget -->\n    <script>\n      window.VOICE_LOGGER_CONFIG = {\n        webhookUrl: "https://n8n.trevorduke.com/webhook/baby-buddy-audio",\n        enabled: true\n      };\n    </script>\n    <script src="{% static '"'"'babybuddy/js/voice-logger-widget.js'"'"' %}"></script>\n  </body>|' "$TEMPLATE_FILE"

bashio::log.info "Voice Logger widget installed successfully!"
