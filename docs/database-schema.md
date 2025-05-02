# Database Schema

## Tables

### profiles
Stores user profile information including business details and branding preferences.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| created_at | timestamptz | Creation timestamp |
| user_id | uuid | Foreign key to auth.users |
| business_name | text | Name of the freelancer's business |
| address | text | Business address |
| pan_number | text | PAN (Permanent Account Number) |
| phone | text | Contact phone number |
| logo_url | text | URL to the business logo |
| primary_color | text | Primary brand color (default: '#3B82F6') |
| secondary_color | text | Secondary brand color (default: '#0EA5E9') |
| footer_text | text | Custom text for invoice footer |

### banking_info
Stores banking details used for invoice payment instructions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| created_at | timestamptz | Creation timestamp |
| user_id | uuid | Foreign key to auth.users |
| account_holder | text | Name of the account holder |
| account_number | text | Bank account number |
| ifsc_code | text | Bank IFSC code |
| bank_name | text | Name of the bank |
| branch | text | Bank branch name |

### clients
Stores information about the freelancer's clients.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| created_at | timestamptz | Creation timestamp |
| user_id | uuid | Foreign key to auth.users |
| name | text | Client name |
| company_name | text | Client's company name |
| billing_address | text | Client's billing address |
| gst_number | text | Client's GST number |
| contact_person | text | Client's contact person |
| email | text | Client's email address |
| phone | text | Client's phone number |
| status | text | Client status (default: 'active') |
| engagement_status | text | Client engagement status (default: 'onboarding') |

### engagement_models
Stores the engagement model details for each client.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| created_at | timestamptz | Creation timestamp |
| client_id | uuid | Foreign key to clients |
| type | text | Type of engagement ('retainership', 'project', 'milestone', 'service') |
| retainer_amount | numeric | Monthly retainer amount |
| project_value | numeric | Total project value |
| service_rates | jsonb | Array of service rates |

### tasks
Stores tasks or milestones associated with clients.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| created_at | timestamptz | Creation timestamp |
| client_id | uuid | Foreign key to clients |
| name | text | Task name |
| description | text | Task description |
| start_date | date | Task start date |
| end_date | date | Task end date |
| status | text | Task status ('pending', 'in_progress', 'completed') |
| engagement_model_id | uuid | Foreign key to engagement_models |

### invoices
Stores invoice information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| created_at | timestamptz | Creation timestamp |
| user_id | uuid | Foreign key to auth.users |
| client_id | uuid | Foreign key to clients |
| invoice_number | text | Invoice number |
| issue_date | date | Invoice issue date |
| due_date | date | Invoice due date |
| status | text | Invoice status ('draft', 'sent', 'paid', 'overdue', 'partially_paid') |
| subtotal | numeric | Invoice subtotal before tax |
| tax | numeric | Tax amount |
| total | numeric | Total invoice amount |
| notes | text | Additional invoice notes |
| currency | text | Invoice currency ('INR', 'USD') |
| engagement_type | text | Type of engagement for this invoice |
| tax_percentage | numeric | Tax percentage applied |
| reverse_calculation | boolean | Whether tax was calculated in reverse |
| payment_date | date | Date payment was received |
| payment_method | text | Method of payment |
| payment_reference | text | Payment reference or transaction ID |
| partially_paid_amount | numeric | Amount paid for partial payments |
| is_partially_paid | boolean | Whether the invoice is partially paid |

### invoice_items
Stores line items for each invoice.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| created_at | timestamptz | Creation timestamp |
| invoice_id | uuid | Foreign key to invoices |
| description | text | Item description |
| quantity | numeric | Item quantity |
| rate | numeric | Item rate/price |
| amount | numeric | Total amount (quantity * rate) |
| task_id | uuid | Foreign key to tasks |
| milestone_name | text | Name of milestone (for milestone-based invoices) |

### documents
Stores documents associated with clients.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| created_at | timestamptz | Creation timestamp |
| client_id | uuid | Foreign key to clients |
| name | text | Document name |
| file_url | text | URL to the document file |
| type | text | Document type ('contract', 'scope', 'other') |

## Relationships

- **profiles** has a one-to-one relationship with **users**
- **banking_info** has a one-to-one relationship with **users**
- **clients** has a many-to-one relationship with **users**
- **engagement_models** has a one-to-one relationship with **clients**
- **tasks** has a many-to-one relationship with **clients**
- **invoices** has a many-to-one relationship with both **users** and **clients**
- **invoice_items** has a many-to-one relationship with **invoices**
- **documents** has a many-to-one relationship with **clients**

## Database Triggers

- **create_profile_on_signup**: Automatically creates a profile and banking info entry when a new user signs up

## Storage Buckets

- **logos**: Stores business logos
- **documents**: Stores client documents