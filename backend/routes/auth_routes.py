import time
import logging
from flask import Blueprint, request, jsonify
from backend.config import get_firebase_admin
from backend.middleware.auth import verify_token, require_auth

logger = logging.getLogger("TrafficTwin.Routes.Auth")
auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "").strip() or email.split("@")[0]
    role = data.get("role", "citizen").lower()
    
    if role not in ["citizen", "controller"]:
        role = "citizen"
        
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
        
    _, db_mod, auth_mod = get_firebase_admin()
    
    uid = None
    if auth_mod:
        try:
            user_record = auth_mod.create_user(
                email=email,
                password=password,
                display_name=name
            )
            uid = user_record.uid
            # Set custom claims
            auth_mod.set_custom_user_claims(uid, {"role": role})
        except Exception as e:
            logger.warning(f"Auth user registration note: {e}")
            
    if not uid:
        uid = f"user_{int(time.time())}_{abs(hash(email)) % 10000}"
        
    if db_mod:
        try:
            db_mod.reference(f"Users/{uid}").set({
                "uid": uid,
                "email": email,
                "name": name,
                "role": role,
                "createdAt": int(time.time())
            })
        except Exception as e:
            logger.warning(f"DB User creation error: {e}")
            
    return jsonify({
        "status": "success",
        "message": f"User registered successfully as {role}",
        "user": {
            "uid": uid,
            "email": email,
            "name": name,
            "role": role
        }
    }), 201

@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user():
    from flask import g
    return jsonify({"user": g.user})

@auth_bp.route("/demo-login", methods=["POST"])
def demo_login():
    data = request.get_json() or {}
    role = data.get("role", "citizen").lower()
    email = "controller@demo.com" if role == "controller" else "citizen@demo.com"
    
    return jsonify({
        "status": "success",
        "token": f"demo-{role}-token",
        "user": {
            "uid": f"demo-{role}-id",
            "email": email,
            "name": f"Demo {role.title()}",
            "role": role
        }
    })
