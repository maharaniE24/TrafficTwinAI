import os
import sys
import json
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("TrafficTwin")

FIREBASE_ENV = os.getenv("FIREBASE_ENV", "emulator")
PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "traffictwin-ai-tn")
DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL", "http://127.0.0.1:9000?ns=traffictwin-ai-tn-default-rtdb")
DATABASE_EMULATOR_HOST = os.getenv("FIREBASE_DATABASE_EMULATOR_HOST", "127.0.0.1:9000")
AUTH_EMULATOR_HOST = os.getenv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099")
USE_MOCK_APIS = os.getenv("USE_MOCK_APIS", "true").lower() == "true"
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", "mock_tomtom_api_key")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "mock_openweather_api_key")
PORT = int(os.getenv("PORT", 5000))
HOST = os.getenv("HOST", "127.0.0.1")

# Configure Firebase Admin SDK environment variables for emulator
if FIREBASE_ENV == "emulator":
    os.environ["FIREBASE_DATABASE_EMULATOR_HOST"] = DATABASE_EMULATOR_HOST
    os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = AUTH_EMULATOR_HOST
    logger.info(f"Configured for Firebase Emulator: DB={DATABASE_EMULATOR_HOST}, Auth={AUTH_EMULATOR_HOST}")

class LocalInMemoryDB:
    def __init__(self):
        self.store = {}

    def reference(self, path=""):
        return LocalRef(self.store, path)

class LocalRef:
    def __init__(self, store, path):
        self.store = store
        self.path = path.strip("/")

    def _get_node(self, create=False):
        if not self.path:
            return self.store
        parts = self.path.split("/")
        curr = self.store
        for p in parts:
            if p not in curr:
                if create:
                    curr[p] = {}
                else:
                    return None
            curr = curr[p]
        return curr

    def get(self):
        return self._get_node(create=False)

    def set(self, value):
        if not self.path:
            self.store.clear()
            self.store.update(value)
            return
        parts = self.path.split("/")
        curr = self.store
        for p in parts[:-1]:
            if p not in curr or not isinstance(curr[p], dict):
                curr[p] = {}
            curr = curr[p]
        curr[parts[-1]] = value

    def update(self, dict_values):
        node = self._get_node(create=True)
        if isinstance(node, dict) and isinstance(dict_values, dict):
            node.update(dict_values)

    def child(self, child_path):
        new_path = f"{self.path}/{child_path}".strip("/")
        return LocalRef(self.store, new_path)

local_rtdb = LocalInMemoryDB()
firebase_app = None
firebase_db = None
firebase_auth_module = None

def get_firebase_admin():
    global firebase_app, firebase_db, firebase_auth_module
    if firebase_app is not None:
        return firebase_app, firebase_db, firebase_auth_module
    
    try:
        import firebase_admin
        from firebase_admin import credentials, db, auth
        
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        if service_account_path and os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            firebase_app = firebase_admin.initialize_app(cred, {
                'databaseURL': DATABASE_URL,
                'projectId': PROJECT_ID
            })
            logger.info("Firebase Admin initialized with Service Account.")
            firebase_db = db
            firebase_auth_module = auth
        else:
            # Check if emulator is actively listening before connecting to avoid urllib retry delays
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            host_parts = DATABASE_EMULATOR_HOST.split(":")
            port = int(host_parts[1]) if len(host_parts) > 1 else 9000
            result = sock.connect_ex((host_parts[0], port))
            sock.close()

            if result == 0:
                try:
                    firebase_app = firebase_admin.get_app()
                except ValueError:
                    firebase_app = firebase_admin.initialize_app(options={
                        'databaseURL': DATABASE_URL,
                        'projectId': PROJECT_ID
                    })
                logger.info(f"Connected to live Firebase Emulator ({DATABASE_EMULATOR_HOST}).")
                firebase_db = db
                firebase_auth_module = auth
            else:
                logger.info("Firebase Emulator not running. Using in-memory Realtime Database & Auth.")
                firebase_db = local_rtdb
                firebase_auth_module = None
                
        return firebase_app, firebase_db, firebase_auth_module
    except Exception as e:
        logger.warning(f"Using in-memory Local RTDB fallback: {e}")
        firebase_db = local_rtdb
        return None, firebase_db, None
