# Project File Structure

## Root Files
- `.env`: Environment variables for Supabase connection
- `eslint.config.js`: ESLint configuration
- `index.html`: Main HTML entry point
- `package.json`: Project dependencies and scripts
- `postcss.config.js`: PostCSS configuration
- `README.md`: Project README
- `tailwind.config.js`: Tailwind CSS configuration
- `tsconfig.app.json`: TypeScript configuration for application
- `tsconfig.json`: Main TypeScript configuration
- `tsconfig.node.json`: TypeScript configuration for Node
- `vite.config.ts`: Vite build configuration

## Source Files (`src/`)

### Main Files
- `App.tsx`: Main application component with routing
- `index.css`: Global styles
- `main.tsx`: Application entry point
- `vite-env.d.ts`: Vite environment type definitions

### Components (`src/components/`)

#### Authentication Components (`src/components/auth/`)
- `ProtectedRoute.tsx`: Route protection component

#### Invoice Components (`src/components/invoices/`)
- `ActionButtons.tsx`: Invoice action buttons
- `InvoiceHeader.tsx`: Invoice header component
- `InvoiceNotes.tsx`: Invoice notes component
- `InvoicePreviewContent.tsx`: Invoice preview content
- `InvoicePreviewModal.tsx`: Modal for invoice preview
- `InvoiceTotals.tsx`: Invoice totals component
- `MilestoneItems.tsx`: Milestone items component
- `ProjectItem.tsx`: Project item component
- `RecordPaymentModal.tsx`: Modal for recording payments
- `RetainershipItem.tsx`: Retainership item component
- `ServiceItems.tsx`: Service items component
- `TaxSettings.tsx`: Tax settings component

#### Layout Components (`src/components/layout/`)
- `Layout.tsx`: Main layout component
- `Navbar.tsx`: Navigation bar component
- `Sidebar.tsx`: Sidebar component

#### UI Components (`src/components/ui/`)
- `Modal.tsx`: Reusable modal component

### Library Files (`src/lib/`)
- `supabase.ts`: Supabase client setup and type definitions

### Pages (`src/pages/`)

#### Auth Pages (`src/pages/auth/`)
- `Login.tsx`: Login page
- `Register.tsx`: Registration page

#### Client Pages (`src/pages/clients/`)
- `ClientDetails.tsx`: Client details page
- `Clients.tsx`: Clients listing page
- `EditClient.tsx`: Edit client page
- `NewClient.tsx`: New client page

#### Invoice Pages (`src/pages/invoices/`)
- `InvoiceDetails.tsx`: Invoice details page
- `InvoicePDF.tsx`: Invoice PDF view
- `InvoicePreview.tsx`: Invoice preview page
- `Invoices.tsx`: Invoices listing page
- `NewInvoice.tsx`: New invoice page

#### Profile Pages (`src/pages/profile/`)
- `BankingInfo.tsx`: Banking information page
- `Profile.tsx`: Profile management page

#### Other Pages
- `Dashboard.tsx`: Main dashboard page
- `NotFound.tsx`: 404 not found page

### State Management (`src/store/`)
- `authStore.ts`: Authentication state store
- `clientStore.ts`: Client data state store
- `invoiceStore.ts`: Invoice data state store
- `profileStore.ts`: Profile data state store

### Type Definitions (`src/types/`)
- `invoice.ts`: Invoice-related type definitions

### Utilities (`src/utils/`)
- `helpers.ts`: Utility functions

## Supabase Files (`supabase/`)

### Migrations (`supabase/migrations/`)
- `20250502102454_throbbing_lodge.sql`: Initial schema creation
- `20250502103931_ivory_art.sql`: Client RLS policy updates
- `20250502104127_jade_spire.sql`: Fix client RLS policies
- `20250502104311_sunny_base.sql`: Additional RLS policy fixes
- `20250502104614_stark_heart.sql`: Disable RLS on clients table
- `20250502105158_misty_disk.sql`: Add currency support
- `20250502110006_floating_violet.sql`: Milestone handling improvements
- `20250502115119_shiny_firefly.sql`: Add tax calculation fields
- `20250502130603_white_lantern.sql`: Payment tracking functionality
- `20250502140539_delicate_reef.sql`: Remove storage RLS policies
- `20250502141340_tight_grass.sql`: Fix logo storage issues
- `20250502141648_bold_lagoon.sql`: Fix logo persistence issues
- `20250503173428_fix_logo_persistence.sql`: Additional logo persistence fixes

## Documentation (`docs/`)
- `database-schema.md`: Database schema documentation
- `functionalities-implemented.md`: Implemented features documentation
- `filenames.md`: Project file structure documentation