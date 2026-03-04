

## SisterSignal Database Schema Setup

### Database Tables & Schema

**1. Profiles table** (extends auth.users)
- `id` (uuid, PK, references auth.users)
- `first_name` (text, not null)
- `phone` (text)
- `city` (text)
- `verification_status` (enum: pending/verified/rejected, default pending)
- `id_doc_url` (text)
- `selfie_url` (text)
- `responder_available` (boolean, default false)
- `created_at`, `updated_at` (timestamptz)

**2. Requests table**
- `id` (uuid, PK)
- `requester_id` (uuid, references profiles, not null)
- `type` (enum: escort/pickup/checkin/other)
- `urgency` (enum: low/medium/high)
- `note` (text)
- `lat` (double precision, nullable)
- `lng` (double precision, nullable)
- `status` (enum: open/assigned/closed/cancelled, default open)
- `assigned_responder_id` (uuid, references profiles, nullable)
- `created_at` (timestamptz)

**3. Messages table**
- `id` (uuid, PK)
- `request_id` (uuid, references requests, not null)
- `sender_id` (uuid, references profiles, not null)
- `text` (text, not null)
- `created_at` (timestamptz)

**4. Trusted Contacts table**
- `id` (uuid, PK)
- `user_id` (uuid, references profiles, not null)
- `name` (text, not null)
- `phone` (text, not null)
- `created_at` (timestamptz)

**5. Reports table**
- `id` (uuid, PK)
- `reporter_id` (uuid, references profiles, not null)
- `reported_user_id` (uuid, references profiles, not null)
- `request_id` (uuid, references requests, nullable)
- `reason` (text, not null)
- `details` (text)
- `created_at` (timestamptz)

**6. User Roles table** (for admin access)
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users, not null)
- `role` (enum: admin/moderator/user)
- Unique constraint on (user_id, role)

### Security Functions
- `has_role(user_id, role)` — security definer function to check admin status without RLS recursion
- `is_verified(user_id)` — check if a user is verified

### RLS Policies

| Table | Policy |
|-------|--------|
| **Profiles** | Users can read own profile; verified users can see first_name of others; users can update own profile; admin can read/update all |
| **Requests** | Verified users can insert; requester + assigned responder can read their own; verified available responders can see open requests; admin can read all |
| **Messages** | Requester + assigned responder of a request can read/insert messages for that request |
| **Trusted Contacts** | Users can CRUD only their own contacts (max 3 enforced via trigger) |
| **Reports** | Authenticated users can insert; admin can read all |
| **User Roles** | Admin can read all; users can read own role |

### Storage
- **`verification-docs`** bucket — for ID document and selfie uploads
  - Authenticated users can upload to their own folder (`{user_id}/`)
  - Admin can read all files
  - Users can read their own files

### Database Functions & Triggers
- Auto-create profile row on auth.users insert (trigger on auth.users via a function)
- Trusted contacts limit trigger (max 3 per user)
- Enable realtime on `messages` and `requests` tables

### Migration Execution
All of the above will be executed as a single database migration, creating enums, tables, functions, triggers, RLS policies, and the storage bucket in one go.

