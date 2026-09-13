#!/bin/bash
# Bootstrap JDK 21 + Android SDK in /home/z/my-project (no sudo needed)
set -e

JDK_DIR=/home/z/my-project/jdk
SDK_DIR=/home/z/my-project/android-sdk

# === JDK 21 (Eclipse Temurin) ===
if [ ! -f "$JDK_DIR/jdk-21.0.5+11/bin/javac" ]; then
  echo "=== [1/3] Downloading Eclipse Temurin JDK 21 ==="
  mkdir -p "$JDK_DIR"
  cd "$JDK_DIR"
  curl -sL -o jdk21.tar.gz "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.5%2B11/OpenJDK21U-jdk_x64_linux_hotspot_21.0.5_11.tar.gz"
  tar -xzf jdk21.tar.gz
  rm jdk21.tar.gz
  echo "JDK installed: $JDK_DIR/jdk-21.0.5+11"
else
  echo "=== [1/3] JDK already installed ==="
fi

# === Android command-line tools ===
if [ ! -f "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo ""
  echo "=== [2/3] Downloading Android command-line tools ==="
  mkdir -p "$SDK_DIR/cmdline-tools"
  cd "$SDK_DIR/cmdline-tools"
  curl -sL -o cmdline-tools.zip "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
  unzip -q cmdline-tools.zip
  rm cmdline-tools.zip
  mv cmdline-tools latest
  echo "Android cmdline-tools installed: $SDK_DIR/cmdline-tools/latest"
else
  echo "=== [2/3] Android cmdline-tools already installed ==="
fi

# === Install platform-tools + platforms;android-36 + build-tools;36.0.0 ===
echo ""
echo "=== [3/3] Installing Android SDK packages ==="
export JAVA_HOME=$JDK_DIR/jdk-21.0.5+11
export ANDROID_HOME=$SDK_DIR
export ANDROID_SDK_ROOT=$SDK_DIR
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

if [ ! -d "$SDK_DIR/platforms/android-36" ]; then
  yes | sdkmanager --licenses 2>&1 | tail -3
  sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" 2>&1 | tail -5
else
  echo "Android SDK packages already installed."
fi

# === Create local.properties ===
echo "sdk.dir=$SDK_DIR" > /home/z/my-project/android/local.properties

echo ""
echo "=== DONE ==="
echo "JAVA_HOME=$JAVA_HOME"
echo "ANDROID_HOME=$ANDROID_HOME"
java -version 2>&1
javac -version 2>&1
