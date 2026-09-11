#!/bin/bash
# Creates a complete project zip including source code, build artifacts, and config
set -e

PROJECT_ROOT=/home/z/my-project
STAGE_DIR=/tmp/arrow-puzzle-pkg
PKG_DIR=$STAGE_DIR/arrow-puzzle
ZIP_PATH=/home/z/my-project/download/arrow-puzzle-v1.6.0-full.zip

# Clean previous stage
rm -rf "$STAGE_DIR"
mkdir -p "$PKG_DIR"

echo "==> Copying source code..."
cp -r "$PROJECT_ROOT/src" "$PKG_DIR/"
cp -r "$PROJECT_ROOT/scripts" "$PKG_DIR/"
cp -r "$PROJECT_ROOT/public" "$PKG_DIR/"
cp -r "$PROJECT_ROOT/prisma" "$PKG_DIR/" 2>/dev/null || true
cp -r "$PROJECT_ROOT/db" "$PKG_DIR/" 2>/dev/null || true
cp -r "$PROJECT_ROOT/examples" "$PKG_DIR/" 2>/dev/null || true

# Copy android folder but exclude build artifacts
echo "==> Copying android (excluding build/ and .gradle/)..."
mkdir -p "$PKG_DIR/android"
for item in "$PROJECT_ROOT"/android/*; do
  [ -e "$item" ] || continue
  base=$(basename "$item")
  if [ "$base" = ".gradle" ]; then
    continue
  fi
  if [ "$base" = "app" ]; then
    # copy app but exclude build/
    mkdir -p "$PKG_DIR/android/app"
    for sub in "$PROJECT_ROOT"/android/app/*; do
      [ -e "$sub" ] || continue
      subbase=$(basename "$sub")
      if [ "$subbase" = "build" ]; then
        continue
      fi
      cp -r "$sub" "$PKG_DIR/android/app/"
    done
  else
    cp -r "$item" "$PKG_DIR/android/"
  fi
done

# Copy config files at root
echo "==> Copying root config files..."
for f in package.json package-lock.json bun.lock tsconfig.json next.config.ts \
         next-env.d.ts capacitor.config.ts tailwind.config.ts postcss.config.mjs \
         components.json eslint.config.mjs Caddyfile worklog.md \
         play-store-setup.sh arrow-puzzle-keystore.jks .gitignore .gitattributes \
         .env .env.local .env.production .env.example; do
  [ -f "$PROJECT_ROOT/$f" ] && cp "$PROJECT_ROOT/$f" "$PKG_DIR/"
done

# Copy download folder (only important artifacts)
echo "==> Copying build artifacts..."
mkdir -p "$PKG_DIR/download"
for f in arrow-puzzle-v1.6.0.apk \
         arrow-puzzle-v1.6.0.aab \
         arrow-puzzle-keystore.jks \
         KEYSTORE-DETAILS.txt \
         app-icon.png \
         arrow-puzzle-icon-192.png \
         arrow-puzzle-icon-512.png \
         arrow-puzzle-icon.png \
         README.md; do
  [ -f "$PROJECT_ROOT/download/$f" ] && cp "$PROJECT_ROOT/download/$f" "$PKG_DIR/download/"
done

# Add a top-level README describing contents
cp "$PROJECT_ROOT/PROJECT-README.md" "$PKG_DIR/PROJECT-README.md"

echo "==> Creating zip..."
cd "$STAGE_DIR"
zip -r -q "$ZIP_PATH" arrow-puzzle/

echo "==> Done!"
ls -lh "$ZIP_PATH"
echo ""
echo "Total files in zip:"
find "$PKG_DIR" -type f | wc -l
echo ""
echo "Total size:"
du -sh "$PKG_DIR/"
