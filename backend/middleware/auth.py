import functools
import logging
from flask import request, jsonify, g
from backend.config import get_firebase_admin

logger = logging.getLogger("TrafficTwin.Auth")

def verify_token(token):
    """
    Verify Firebase ID token. Returns user dict containing uid, email, and role.
    """
    if not token:
        return None
    
    # Handle demo tokens for local test bypass if sent with "Bearer demo-citizen" / "Bearer demo-controller"
    if token.startswith("demo-"):
        role = "controller" if "controller" in token else "citizen"
        return {
            "uid": f"{role}-demo-uid",
            "email": f"{role}@demo.com",
            "role": role,
            "name": "Demo Controller" if role == "controller" else "Demo Citizen"
        }
    
    _, db_mod, auth_mod = get_firebase_admin()
    if auth_mod:
        try:
            decoded_token = auth_mod.verify_id_token(token)
            uid = decoded_token.get("uid")
            email = decoded_token.get("email", "")
            
            # Lookup role in /Users/{uid} in Realtime Database or token claims
            role = decoded_token.get("role")
            if not role and db_mod:
                try:
                    user_ref = db_mod.reference(f"Users/{uid}").get()
                    if user_ref and isinstance(user_ref, dict):
                        role = user_ref.get("role", "citizen")
                except Exception as e:
                    logger.debug(f"DB user lookup error: {e}")
            
            if not role:
                # Default controller for controller@demo.com, else citizen
                role = "controller" if email.startswith("controller@") else "citizen"
                
            return {
                "uid": uid,
                "email": email,
                "role": role,
                "name": decoded_token.get("name", email.split("@")[0])
            }
        except Exception as e:
            logger.warning(f"Firebase token verification failed: {e}")
            return None
    else:
        # Fallback if Firebase auth module isn't connected
        return {
            "uid": "dev-user",
            "email": "controller@demo.com",
            "role": "controller",
            "name": "Local Controller"
        }

def require_auth(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = ""
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
        
        user = verify_token(token)
        if not user:
            return jsonify({"error": "Unauthorized. Missing or invalid Firebase ID token."}), 401
        
        g.user = user
        return f(*args, **kwargs)
    return decorated_function

def require_role(required_role):
    """
    Role check decorator. If required_role is 'controller', only controllers are allowed.
    Citizens will receive a strict 403 Forbidden.
    """
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            token = ""
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ", 1)[1].strip()
            
            user = verify_token(token)
            if not user:
                return jsonify({"error": "Unauthorized. Missing or invalid authentication token."}), 401
            
            user_role = user.get("role", "citizen")
            if required_role == "controller" and user_role != "controller":
                return jsonify({
                    "error": "Forbidden. This action requires Traffic Controller privileges.",
                    "required_role": required_role,
                    "user_role": user_role
                }), 403
            
            g.user = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator
