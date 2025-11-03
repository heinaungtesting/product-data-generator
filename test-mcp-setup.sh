#!/bin/bash

# PDG MCP Server Test Script
# Tests all components of the MCP integration

set -e  # Exit on error

echo "🧪 PDG MCP Server - Integration Test"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Test 1: Check Node.js version
echo "Test 1: Node.js Version"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    if [[ "$NODE_VERSION" == v18* ]] || [[ "$NODE_VERSION" == v19* ]] || [[ "$NODE_VERSION" == v20* ]] || [[ "$NODE_VERSION" == v21* ]]; then
        pass "Node.js version $NODE_VERSION (>=18 required)"
    else
        fail "Node.js version $NODE_VERSION (need >=18)"
    fi
else
    fail "Node.js not found"
fi
echo ""

# Test 2: Check repository structure
echo "Test 2: Repository Structure"
if [ -d "prisma" ]; then
    pass "prisma/ directory exists"
else
    fail "prisma/ directory missing"
fi

if [ -f "prisma/schema.prisma" ]; then
    pass "Prisma schema exists"
else
    fail "Prisma schema missing"
fi

if [ -d "mcp-server-local" ]; then
    pass "mcp-server-local/ directory exists"
else
    fail "mcp-server-local/ directory missing"
fi

if [ -d "mcp-server" ]; then
    pass "mcp-server/ (bundle generator) exists"
else
    fail "mcp-server/ directory missing"
fi
echo ""

# Test 3: Check Prisma database
echo "Test 3: Database"
if [ -f "prisma/dev.db" ]; then
    pass "Database file exists (prisma/dev.db)"

    # Check if database is tracked in git
    if git ls-files --error-unmatch prisma/dev.db &> /dev/null; then
        pass "Database is tracked in git"
    else
        warn "Database NOT tracked in git (run: git add prisma/dev.db)"
    fi
else
    fail "Database file missing (run: npx prisma migrate deploy)"
fi
echo ""

# Test 4: Check MCP Server files
echo "Test 4: MCP Server Files"
if [ -f "mcp-server-local/package.json" ]; then
    pass "MCP server package.json exists"
else
    fail "MCP server package.json missing"
fi

if [ -f "mcp-server-local/index.js" ]; then
    pass "MCP server index.js exists"
else
    fail "MCP server index.js missing"
fi

if [ -f "mcp-server-local/README.md" ]; then
    pass "MCP server README exists"
else
    warn "MCP server README missing"
fi
echo ""

# Test 5: Check bundle generator modifications
echo "Test 5: Bundle Generator"
if grep -q "PrismaClient" mcp-server/build-bundle.js; then
    pass "Bundle generator uses Prisma"
else
    fail "Bundle generator still uses NDJSON (not updated)"
fi

if [ -f "mcp-server/package.json" ]; then
    if grep -q "@prisma/client" mcp-server/package.json; then
        pass "Bundle generator has Prisma dependency"
    else
        fail "Bundle generator missing Prisma dependency"
    fi
fi
echo ""

# Test 6: Check GitHub Actions
echo "Test 6: GitHub Actions Workflow"
if [ -f ".github/workflows/publish-bundle.yml" ]; then
    pass "GitHub Actions workflow exists"

    if grep -q "prisma/dev.db" .github/workflows/publish-bundle.yml; then
        pass "Workflow triggers on database changes"
    else
        fail "Workflow doesn't trigger on database changes"
    fi

    if grep -q "prisma generate" .github/workflows/publish-bundle.yml; then
        pass "Workflow includes Prisma generate step"
    else
        fail "Workflow missing Prisma generate step"
    fi
else
    fail "GitHub Actions workflow missing"
fi
echo ""

# Test 7: Check documentation
echo "Test 7: Documentation"
if [ -f "MCP_SETUP.md" ]; then
    pass "MCP setup guide exists"
else
    fail "MCP_SETUP.md missing"
fi

if grep -q "MCP" README.md; then
    pass "README mentions MCP integration"
else
    warn "README doesn't mention MCP"
fi
echo ""

# Test 8: Check MCP server dependencies
echo "Test 8: MCP Server Dependencies"
if [ -d "mcp-server-local/node_modules" ]; then
    pass "MCP server dependencies installed"
else
    warn "MCP server dependencies not installed (run: cd mcp-server-local && npm install)"
fi

if [ -d "mcp-server/node_modules" ]; then
    pass "Bundle generator dependencies installed"
else
    warn "Bundle generator dependencies not installed (run: cd mcp-server && npm install)"
fi
echo ""

# Test 9: Check Prisma Client
echo "Test 9: Prisma Client"
if [ -d "node_modules/.prisma" ] || [ -d "node_modules/@prisma/client" ]; then
    pass "Prisma Client generated"
else
    warn "Prisma Client not generated (run: npx prisma generate)"
fi
echo ""

# Test 10: Check git configuration
echo "Test 10: Git Configuration"
if git config user.name &> /dev/null; then
    GIT_NAME=$(git config user.name)
    pass "Git user.name configured: $GIT_NAME"
else
    fail "Git user.name not configured (MCP auto-commit will fail)"
fi

if git config user.email &> /dev/null; then
    GIT_EMAIL=$(git config user.email)
    pass "Git user.email configured: $GIT_EMAIL"
else
    fail "Git user.email not configured (MCP auto-commit will fail)"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" == "main" ]; then
    pass "On main branch"
else
    warn "Not on main branch (current: $CURRENT_BRANCH)"
fi
echo ""

# Test 11: Manual MCP server test (optional)
echo "Test 11: MCP Server Manual Test"
echo "To test the MCP server manually, run:"
echo "  cd mcp-server-local"
echo "  node index.js"
echo ""
echo "You should see:"
echo "  ✅ Database connected successfully"
echo "  🚀 PDG MCP Server running"
echo ""
warn "Manual test required (press Ctrl+C to stop after testing)"
echo ""

# Summary
echo "======================================"
echo "Test Summary:"
echo -e "${GREEN}Passed: $PASS${NC}"
if [ $FAIL -gt 0 ]; then
    echo -e "${RED}Failed: $FAIL${NC}"
fi
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All critical tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure Claude Desktop (see MCP_SETUP.md)"
    echo "2. Restart Claude Desktop"
    echo "3. Test creating a product in Claude Desktop"
    echo "4. Verify git commit happens"
    echo "5. Check GitHub Actions runs"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please fix the issues above.${NC}"
    exit 1
fi
