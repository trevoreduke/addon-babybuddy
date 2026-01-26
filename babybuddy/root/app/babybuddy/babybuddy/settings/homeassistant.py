import os
from .base import *

# Override timezone from environment variable (set by TZ in container)
TIME_ZONE = os.environ.get('TIME_ZONE', 'UTC')

ENABLE_HOME_ASSISTANT_SUPPORT = True
MESSAGE_STORAGE = "django.contrib.messages.storage.session.SessionStorage"
