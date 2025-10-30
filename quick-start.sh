#!/bin/bash

# Callvia Quick Start Script
# This script helps you set up the Callvia project quickly

echo "🚀 Callvia Quick Start Setup"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"
echo ""

# Create project directory
echo "📁 Creating project directory..."
mkdir -p callvia
cd callvia

# Initialize Next.js project
echo "🎨 Initializing Next.js project..."
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Install additional dependencies
echo "📦 Installing dependencies..."
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install stripe @stripe/stripe-js
npm install axios date-fns recharts lucide-react
npm install react-hot-toast papaparse zod clsx tailwind-merge
npm install -D @types/papaparse

# Create directory structure
echo "📂 Creating directory structure..."
mkdir -p app/api/webhooks/retell
mkdir -p app/api/webhooks/calcom
mkdir -p app/api/webhooks/stripe
mkdir -p app/api/leads/import
mkdir -p app/api/appointments/verify
mkdir -p app/dashboard
mkdir -p app/campaigns
mkdir -p app/leads
mkdir -p app/appointments
mkdir -p app/billing
mkdir -p app/admin
mkdir -p components/ui
mkdir -p components/layouts
mkdir -p lib
mkdir -p types

# Copy files from package
echo "📄 Copy the following files from the package to your project:"
echo ""
echo "1. Copy callvia-schema.sql to project root"
echo "2. Copy all app-*.ts files to corresponding directories:"
echo "   - app-api-webhooks-retell-route.ts → app/api/webhooks/retell/route.ts"
echo "   - app-api-webhooks-calcom-route.ts → app/api/webhooks/calcom/route.ts"
echo "   - app-api-webhooks-stripe-route.ts → app/api/webhooks/stripe/route.ts"
echo "   - app-api-leads-import-route.ts → app/api/leads/import/route.ts"
echo "   - app-api-appointments-verify-route.ts → app/api/appointments/verify/route.ts"
echo "   - app-dashboard-page.tsx → app/dashboard/page.tsx"
echo "   - app-campaigns-page.tsx → app/campaigns/page.tsx"
echo "3. Copy tailwind.config.js to project root"
echo "4. Copy .env.example to .env.local and fill in your credentials"
echo ""

# Create .env.local template
echo "🔐 Creating .env.local template..."
cat > .env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Retell AI
RETELL_API_KEY=
NEXT_PUBLIC_RETELL_AGENT_ID=

# Cal.com
CALCOM_API_KEY=
NEXT_PUBLIC_CALCOM_EMBED_URL=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF

echo ""
echo "✅ Basic setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env.local with your API credentials"
echo "2. Set up Supabase project and run callvia-schema.sql"
echo "3. Copy the API route files to their correct locations"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "📖 Read SETUP_GUIDE.md for detailed instructions"
echo "🚀 Happy building!"
