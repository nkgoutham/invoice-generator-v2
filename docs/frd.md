# Functional Requirements Document

## Design Principles and Visual Identity

### Design Philosophy
- **Clean and Professional**: The application uses a clean, minimalist design that prioritizes content and functionality
- **Intuitive Navigation**: Clear hierarchy and consistent navigation patterns throughout the application
- **Visual Feedback**: Interactive elements provide immediate visual feedback to user actions
- **Whitespace Utilization**: Generous use of whitespace to create breathing room and improve readability
- **Consistency**: Uniform design patterns, spacing, and component styles across all pages

### Color Palette

#### Primary Colors
- **Accent Blue** (#5090f0): Used for primary actions, links, and key UI elements
  - Lighter shades: #e0efff, #c7e1ff, #a0cbff, #73adff
  - Darker shades: #3a72d4, #2a5cb3, #294d94, #284379

- **Secondary Accent** (#77B5FE): Used for secondary elements and visual accents
  - Lighter shades: #ccf7f8, #a1f0f7, #70e2eb, #43c9d9
  - Darker shades: #2798ad, #1f7a92, #1e637a, #1e5468

#### Neutral Colors
- **Neutrals**: A grayscale palette for text, backgrounds, and subtle UI elements
  - Light: #f8f9fa, #f1f3f5, #e9ecef, #dee2e6
  - Medium: #ced4da, #adb5bd, #868e96
  - Dark: #495057, #343a40, #212529

#### Semantic Colors
- **Success**: #10B981 (emerald) - For success states, confirmations
- **Warning**: #F59E0B (amber) - For warnings, pending states
- **Danger**: #EF4444 (red) - For errors, destructive actions
- **Info**: #3B82F6 (blue) - For informational messages

### Typography
- **Primary Font**: Inter (with system fallbacks)
- **Hierarchy**:
  - Headings: Bold weight, larger sizes
  - Body: Regular weight, comfortable reading size
  - Small text: Lighter weight for secondary information
- **Line Heights**: Generous line heights for improved readability

### Component Design

#### Cards
- Subtle shadows with hover effects
- Rounded corners (border-radius: 0.75rem)
- White backgrounds with subtle borders
- Transition effects on hover

#### Buttons
- Clear visual hierarchy (primary, secondary, danger)
- Consistent padding and sizing
- Icon + text combinations
- Loading states
- Hover and focus states

#### Forms
- Clearly labeled inputs
- Validation feedback
- Consistent spacing
- Helpful placeholder text

#### Status Indicators
- Color-coded badges for different statuses
- Icon + text combinations for clarity
- Consistent positioning

## Overview
easyinvoice is a comprehensive invoicing application designed specifically for freelancers and small businesses. It provides a streamlined way to manage clients, create and track invoices, and monitor revenue.

## Core Functionalities

### 1. Authentication System

#### User Registration
- Email and password signup
- Form validation for proper email format and password strength
- Automatic profile creation upon signup

#### User Login
- Email and password authentication
- Session persistence with automatic token refresh
- Password reset functionality via email

#### Session Management
- Automatic session persistence
- Token refresh mechanism
- Session expiration handling
- Session validation on protected routes

### 2. Dashboard

#### Overview Statistics
- Total clients count
- Total invoices with status breakdown
- Total paid revenue
- Pending revenue amount
- Currency toggle between INR and USD

#### Revenue Visualization
- Monthly revenue trend chart
- Time range selection (3, 6, 12, 24 months)
- Interactive tooltips showing revenue for each month
- Automatic currency conversion based on user preference

#### Recent Activity
- Recent invoices list with status indicators
- Recent payments received
- Quick navigation to detailed views

#### Client Revenue Analysis
- Top clients by revenue
- Percentage breakdown of revenue by client
- Visual representation with progress bars

### 3. Client Management

#### Client Creation
- Add new clients with comprehensive details:
  - Name and company information
  - Contact details (email, phone)
  - Billing address
  - GST/tax number
  - Status tracking (active, inactive, prospect)
  - Engagement status (onboarding, active, project, retainer, etc.)

#### Client Listing
- Searchable and filterable client list
- Status indicators
- Quick access to client details
- Responsive grid/list view

#### Client Details
- Comprehensive client information display
- Engagement model details
- Quick actions (edit, delete, create invoice)
- Recent invoices for the client

#### Engagement Models
- Support for multiple engagement types:
  - Retainership-based
  - Project-based
  - Milestone-based
  - Service/hourly-based
- Financial details tracking (rates, retainer amounts, project values)

### 4. Invoice Management

#### Invoice Creation
- Multiple invoice types based on engagement model:
  - Retainer invoices
  - Project invoices
  - Milestone-based invoices
  - Service/hour-based invoices
- Automatic invoice numbering
- Tax calculation with support for:
  - Standard tax calculation (adding tax to subtotal)
  - Reverse tax calculation (calculating from desired net amount)
  - Configurable tax percentages
- Multi-currency support (INR, USD)
- Due date calculation
- Notes and terms

#### Invoice Listing
- Searchable and filterable invoice list
- Status indicators (draft, sent, paid, overdue, partially paid)
- Quick access to invoice details
- Sorting options (date, amount)

#### Invoice Details
- Comprehensive invoice information
- Line item details
- Payment status tracking
- Action buttons for common operations

#### Invoice Preview
- Professional invoice preview
- Print-ready format
- PDF generation and download
- Email sending capability

#### Payment Recording
- Record full or partial payments
- Payment method tracking
- Payment reference number
- Payment date recording
- Automatic status updates

#### Past Invoice Recording
- Record invoices that were already paid
- Simplified workflow for historical data entry

### 5. Recurring Invoices

#### Recurring Invoice Setup
- Create invoice templates for regular billing
- Set frequency (weekly, monthly, quarterly, yearly)
- Define start and optional end dates
- Automatic next issue date calculation

#### Recurring Invoice Management
- View and manage all recurring invoice templates
- Enable/disable recurring invoices
- Track last generated invoice
- Preview template details

### 6. Revenue Tracking

#### Revenue Reports
- Comprehensive revenue analysis
- Filter by date range
- Currency conversion
- Export to CSV

#### Monthly Breakdown
- View revenue by month
- Split by currency (INR/USD)
- Total calculations with currency conversion

### 7. Profile Management

#### Business Information
- Update business name and contact details
- Upload and manage business logo
- Set business address and tax identification

#### Brand Customization
- Select primary and secondary brand colors
- Customize invoice footer text
- Preview brand settings

#### Banking Details
- Manage banking information for invoice payment instructions
- Account holder, number, and bank details
- IFSC code and branch information

### 8. Settings

#### Invoice Reminders
- Configure automatic email reminders
- Set days before and after due date for reminders
- Customize reminder email subject and message
- Enable/disable reminder system

#### Currency Settings
- Set preferred currency (INR or USD)
- Configure currency conversion rate
- Apply settings across the application

### 9. UI/UX Features

#### Responsive Design
- Mobile-first approach
- Optimized for all screen sizes
- Consistent experience across devices

#### Modern Interface
- Clean, professional user interface
- Intuitive navigation
- Consistent design language

#### Interactive Elements
- Real-time form validation
- Toast notifications for user feedback
- Loading states for asynchronous operations
- Error handling with user-friendly messages

#### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Semantic HTML structure

## Page-by-Page Functionality

### Login Page
- Email and password input with validation
- "Remember me" option
- Forgot password link
- Registration link for new users

### Registration Page
- Email and password input with validation
- Password confirmation
- Terms acceptance
- Redirect to login after successful registration

### Dashboard Page
- Statistics cards with key metrics
- Revenue trend chart
- Recent invoices and payments
- Top clients by revenue

### Clients Page
- Client listing with search and filter
- Client count and refresh button
- Add client button
- Client cards with key information

### Client Details Page
- Client information display
- Engagement details
- Action buttons (edit, delete, new invoice)
- Recent invoices and tasks

### New/Edit Client Page
- Client information form
- Engagement model configuration
- Save and cancel buttons

### Invoices Page
- Invoice listing with search and filter
- Status filtering
- Sorting options
- Add invoice button

### New Invoice Page
- Client selection
- Engagement type selection
- Dynamic item entry based on engagement type
- Tax settings
- Preview functionality
- Save as draft or finalize

### Past Invoice Form
- Record already paid invoices
- Payment details entry
- Simplified workflow

### Invoice Details Page
- Invoice information display
- Line items table
- Payment status and details
- Action buttons (download PDF, send, record payment)

### Invoice Preview Page
- Professional invoice display
- Print and download options
- Send to client functionality
- Record payment option

### Recurring Invoices Page
- List of recurring invoice templates
- Status indicators
- Frequency information
- Next issue date

### New Recurring Invoice Page
- Template configuration
- Schedule settings
- Invoice template creation
- Auto-send option

### Recurring Invoice Details Page
- Template information
- Schedule details
- Generated invoices history
- Action buttons

### Earnings Page
- Date range selection
- Revenue report table
- Currency breakdown
- Export functionality

### Profile Page
- Business information form
- Logo upload
- Brand color selection
- Footer text customization

### Banking Info Page
- Banking details form
- Account information
- IFSC code and branch details

### Settings Pages
- Invoice reminders configuration
- Currency settings
- Email template customization

## Technical Requirements

### Data Persistence
- All data stored in Supabase database
- Real-time data synchronization
- Offline data handling

### Security
- Row-level security for data isolation
- Secure authentication
- Input sanitization
- Protected API routes

### Performance
- Lazy loading of components
- Optimized database queries
- Efficient state management
- Responsive under load
- Optimized asset loading

### Compatibility
- Support for modern browsers
- Progressive enhancement
- Mobile and desktop compatibility
- Print-optimized styles for invoices

## Future Enhancements
- Expense tracking
- Time tracking integration
- Multiple business profiles
- Client portal
- Advanced reporting
- Tax calculation by region
- Multi-language support
- Invoice templates
- Team collaboration
- Dark mode support
- Customizable dashboard widgets

## Expense Tracking Module

### Overview
The expense tracking module allows freelancers to record, categorize, and analyze their business expenses. It supports both billable and non-billable expenses, with features for receipt management, expense categorization, and comprehensive reporting.

### Core Functionalities

#### 1. Expense Management

##### Expense Recording
- Add new expenses with detailed information
- Track expense date, amount, and description
- Support for multiple currencies (INR, USD)
- Attach receipts to expenses (images or PDFs)
- Add notes and additional details

##### Expense Categorization
- Assign expenses to customizable categories
- Default categories provided for common expense types
- Color-coding for visual organization
- Category-based filtering and reporting

##### Expense Types
- Regular expenses
- Recurring expenses (weekly, monthly, quarterly, yearly)
- Billable expenses (linked to clients)
- Reimbursable expenses with tracking

##### Payment Methods
- Track payment method used (cash, credit card, bank transfer, UPI, other)
- Filter expenses by payment method

#### 2. Client and Invoice Integration

##### Client Association
- Link expenses to specific clients
- Track billable expenses by client
- Include expenses in client invoices

##### Invoice Integration
- Associate expenses with specific invoices
- Track which expenses have been invoiced
- Include billable expenses in new invoices

#### 3. Expense Analysis and Reporting

##### Expense Reports
- Generate comprehensive expense reports
- Filter by date range, category, client, and more
- Export reports to CSV format

##### Visual Analysis
- Category breakdown charts
- Client expense distribution
- Time-based expense trends
- Currency-specific analysis

##### Summary Statistics
- Total expenses by category
- Billable vs. non-billable expenses
- Reimbursable expense tracking
- Multi-currency expense totals

### User Interface

#### Expense List View
- Searchable and filterable expense list
- Quick access to expense details
- Inline actions (edit, delete)
- Receipt preview

#### Expense Detail View
- Comprehensive expense information display
- Receipt viewing and management
- Related client and invoice information
- Edit and delete actions

#### Expense Entry Form
- Intuitive expense entry interface
- Receipt upload with preview
- Dynamic fields based on expense type
- Client and category selection

#### Category Management
- Create, edit, and delete expense categories
- Color selection for visual organization
- Category description and metadata

#### Expense Reports and Analysis
- Interactive charts and visualizations
- Customizable report parameters
- Export functionality
- Summary statistics and insights

### Technical Implementation

#### Data Model
- Expense entity with comprehensive attributes
- Category entity with customization options
- Relationships to clients and invoices
- Support for file storage (receipts)

#### Security
- Row-level security for user data isolation
- Secure file storage for receipts
- Permission-based access control

#### Performance Considerations
- Optimized queries for expense filtering
- Efficient file handling for receipts
- Indexed fields for faster searching
- Pagination for large expense lists