#!/bin/bash
set -e

WORKSPACE="_test_workspace"
EFIS_REPO="https://github.com/alexnj/efis-editor.git"
EFIS_REF="main"

echo "Cleaning up workspace..."
rm -rf "$WORKSPACE"
mkdir -p "$WORKSPACE/_action"

echo "Copying project files to workspace..."
# Copy all files except node_modules, .git, and the workspace itself
rsync -av --progress . "$WORKSPACE/_action" \
    --exclude node_modules \
    --exclude .git \
    --exclude "$WORKSPACE" \
    --exclude "output"

echo "Cloning efis-editor..."
git clone "$EFIS_REPO" "$WORKSPACE/_action/efis-editor"
cd "$WORKSPACE/_action/efis-editor"
git checkout "$EFIS_REF"
cd -

echo "Installing efis-editor dependencies..."
cd "$WORKSPACE/_action/efis-editor"
npm install
cd -

echo "Patching efis-editor..."
cd "$WORKSPACE/_action/efis-editor"
if [ -f "../efis-editor.patch" ]; then
    git apply ../efis-editor.patch
    echo "Patch applied successfully."
else
    echo "Error: Patch file not found!"
    exit 1
fi
cd -

echo "Generating efis-editor protobuf files..."
cd "$WORKSPACE/_action/efis-editor"
npm run genproto
cd -

echo "Generating efis-editor keys..."
cd "$WORKSPACE/_action/efis-editor"
npm run genkeys
cd -

echo "Installing compiler dependencies..."
cd "$WORKSPACE/_action"
npm install
cd -


echo "Building compiler..."
cd "$WORKSPACE/_action"
npm run build
cd -

echo "Setting up test checklist..."
mkdir -p "$WORKSPACE/checklists"
cp sample.json "$WORKSPACE/checklists/"

echo "Running compiler..."
# Mimic the action arguments
# node _action/dist/compiler.js $ARGS
# args from action.yml: 
# --checklistsDir=${{ inputs.checklists_directory }} --outputRootDir=${{ inputs.compiler_output_directory }}
# --pdfOutputGroupHeading=${{ inputs.pdf_output_group_heading }}
# ...

OUTPUT_DIR="$WORKSPACE/artifacts"
CHECKLISTS_DIR="$WORKSPACE/checklists"

echo "Running compiler..."
cd "$WORKSPACE"

# Use relative paths to match Action behavior
node "_action/dist/compiler.js" \
    --checklistsDir="checklists" \
    --outputRootDir="artifacts" \
    --formats="pdf,4col" \
    --pdfOutputGroupHeading=false \
    --pdfMaxIndentedTextHeight=40 \
    --pdfColorHeading='#0000FF' \
    --pdfColorEmergency='#FF0000' \
    --pdfColorAbnormal='#CF3400' \
    --pdfFontSize=9

echo "Checking for output files..."
# Compiler preserves directory structure: artifacts/checklists/sample.4col.pdf
if [ -f "artifacts/checklists/sample.4col.pdf" ]; then
    echo "SUCCESS: artifacts/checklists/sample.4col.pdf found!"
else
    echo "FAILURE: artifacts/checklists/sample.4col.pdf not found."
    ls -R "artifacts"
    exit 1
fi
cd -

echo "Verification Successful!"
