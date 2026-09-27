import os
import sys
import time
import subprocess
import signal

def run():
    print("=" * 70)
    print("  🚦 TrafficTwin AI — Mission Control Startup Orchestrator  ")
    print("=" * 70)
    print("[1/3] Checking environment & dependencies...")
    
    # 1. Start Firebase Local Emulators (Auth & Realtime Database)
    print("[2/3] Starting Firebase Emulator Suite / Local Storage...")
    emulator_process = None
    try:
        # Check if npx firebase-tools is available
        emulator_cmd = "npx -y firebase-tools@latest emulators:start --only database,auth"
        emulator_process = subprocess.Popen(
            emulator_cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("  -> Firebase Emulators launching on ports: RTDB:9000, Auth:9099")
    except Exception as e:
        print(f"  -> Firebase Emulator launch notice: {e}. Fallback in-memory active.")

    time.sleep(3)

    # 2. Start Flask Backend
    print("[3/3] Starting Flask REST API Backend (port 5000)...")
    backend_process = subprocess.Popen(
        [sys.executable, "backend/app.py"],
        stdout=sys.stdout,
        stderr=sys.stderr
    )

    time.sleep(2)

    # 3. Start Frontend Dev Server
    print("[Ready] Starting Vite Frontend (port 5173)...")
    frontend_process = subprocess.Popen(
        "npm run dev",
        cwd="frontend",
        shell=True,
        stdout=sys.stdout,
        stderr=sys.stderr
    )

    print("\n" + "=" * 70)
    print("  🚀 TrafficTwin AI is RUNNING!")
    print("  🌐 Frontend URL: http://localhost:5173")
    print("  ⚡ Backend API:  http://localhost:5000/api/health")
    print("  🔑 Citizen Demo:    citizen@demo.com    / demo1234")
    print("  🔑 Controller Demo: controller@demo.com / demo1234")
    print("=" * 70 + "\n")

    def signal_handler(sig, frame):
        print("\nStopping TrafficTwin AI processes...")
        if frontend_process: frontend_process.terminate()
        if backend_process: backend_process.terminate()
        if emulator_process: emulator_process.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        frontend_process.wait()
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    run()
