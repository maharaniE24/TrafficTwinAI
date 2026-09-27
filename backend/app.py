import os
import sys
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.config import get_firebase_admin, PORT, HOST
from backend.services.seed_data import seed_database
from backend.services.background_streamer import streamer

# Import route blueprints
from backend.routes.auth_routes import auth_bp
from backend.routes.traffic_routes import traffic_bp
from backend.routes.routing_routes import routing_bp
from backend.routes.optimization_routes import optimization_bp
from backend.routes.emergency_routes import emergency_bp
from backend.routes.ml_routes import ml_bp
from backend.routes.analytics_routes import analytics_bp

logger = logging.getLogger("TrafficTwin.App")

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Register blueprints with api prefix
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(traffic_bp, url_prefix="/api/traffic")
    app.register_blueprint(routing_bp, url_prefix="/api/routing")
    app.register_blueprint(optimization_bp, url_prefix="/api/optimization")
    app.register_blueprint(emergency_bp, url_prefix="/api/emergency")
    app.register_blueprint(ml_bp, url_prefix="/api/ml")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "TrafficTwin AI Digital Twin Backend",
            "version": "1.0.0",
            "environment": os.getenv("FIREBASE_ENV", "emulator"),
            "districtsCovered": 38
        })
        
    @app.route("/api/seed", methods=["POST"])
    def trigger_seed():
        success = seed_database()
        return jsonify({
            "status": "success" if success else "warning",
            "message": "Database seeded with 38 Tamil Nadu districts, junction graphs, historical series, and demo users."
        })
        
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404
        
    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal server error: {e}")
        return jsonify({"error": "Internal server error occurred"}), 500

    return app

app = create_app()

if __name__ == "__main__":
    logger.info("Initializing Firebase connection and auto-seeding...")
    try:
        get_firebase_admin()
        seed_database()
    except Exception as e:
        logger.warning(f"Initial seed execution note: {e}")
        
    logger.info("Starting background real-time traffic streamer...")
    streamer.start()
    
    logger.info(f"TrafficTwin AI Backend listening on http://{HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=False)
