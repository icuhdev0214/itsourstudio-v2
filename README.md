<p align="center">
  <img src="public/logo/LOGO_var1.png" alt="it's ouR Studio Logo" width="200" />
</p>

<h1 align="center">it's ouR Studio</h1>
<p align="center">
  <strong>Premium Self-Photography Studio — Full-Stack Web Application & Admin Dashboard</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.1-blue" alt="Version" />
  <img src="https://img.shields.io/badge/react-19.2-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/typescript-5.9-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/vite-7.2-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/firebase-12.6-FFCA28?logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/license-UNLICENSED-red" alt="License" />
</p>

<p align="center">
  <a href="https://itsourstudio.net">Live Website</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-architecture-overview">Architecture</a> •
  <a href="#-api-reference">API Reference</a>
</p>

---

## Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Client-Side Application](#-client-side-application)
  - [Public-Facing Pages](#public-facing-pages)
  - [Admin Dashboard](#admin-dashboard)
  - [Routing](#routing)
  - [State Management](#state-management)
  - [Shared Components](#shared-components)
  - [Utility Modules](#utility-modules)
- [Server-Side Application](#-server-side-application)
  - [API Endpoints](#api-endpoints)
  - [Email System](#email-system)
  - [Cron Jobs & Reminders](#cron-jobs--reminders)
- [Vercel Serverless API](#-vercel-serverless-api)
- [Firebase Integration](#-firebase-integration)
  - [Firestore Collections](#firestore-collections)
  - [Firestore Security Rules](#firestore-security-rules)
  - [Firebase Storage](#firebase-storage)
  - [Storage Security Rules](#storage-security-rules)
  - [Firebase Authentication](#firebase-authentication)
- [Multi-Platform Support](#-multi-platform-support)
  - [Web (Vercel)](#web-vercel)
  - [Desktop — Electron](#desktop--electron)
  - [Desktop — Tauri](#desktop--tauri)
  - [Mobile — Capacitor (Android)](#mobile--capacitor-android)
- [CI/CD Pipelines](#-cicd-pipelines)
- [Testing](#-testing)
- [SEO & Structured Data](#-seo--structured-data)
- [Security Measures](#-security-measures)
- [Scripts & Utilities](#-scripts--utilities)
- [Available NPM Scripts](#-available-npm-scripts)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Credits](#-credits)

---

## Overview

**it's ouR Studio** is a full-stack web application for a premium self-photography studio located in Valenzuela City, Metro Manila, Philippines. The platform serves two primary audiences:

1. **Customers** — A beautiful, responsive public website where users can browse services, view the gallery, check availability, and book photography sessions online with real-time slot management and payment integration (GCash).

2. **Studio Administrators** — A comprehensive admin dashboard for managing bookings, gallery content, services/packages, user accounts, sales ledger, notifications, feedback/testimonials, content management (CMS), bio links, and more.

The application is designed as a **cross-platform solution**, deployable as:
- A **web application** (Vercel)
- A **Windows desktop app** (Electron / Tauri)
- An **Android mobile app** (Capacitor)
- A **macOS desktop app** (Tauri via CI/CD)

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2 | UI component library |
| **TypeScript** | 5.9 | Type-safe development |
| **Vite** | 7.2 | Build tool & dev server |
| **React Router DOM** | 7.9 | Client-side routing |
| **Lucide React** | 0.562 | Icon library |
| **react-colorful** | 5.6 | Color picker for backdrop management |
| **use-sound** | 5.0 | Audio playback (notification sounds) |
| **CSS (Vanilla)** | — | Styling (no CSS framework) |
| **Google Fonts** | — | League Spartan & Quicksand typefaces |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js + Express** | 5.1 | Local backend server |
| **Firebase** | 12.6 | Database (Firestore), Auth, Storage, Analytics |
| **Firebase Admin** | 13.6 | Server-side Firebase operations |
| **Nodemailer** | 7.0 | Transactional email delivery |
| **node-cron** | 4.2 | Scheduled task runner (session reminders) |
| **Multer** | 2.0 | File upload middleware |
| **express-rate-limit** | 8.2 | API rate limiting |
| **bcryptjs** | 3.0 | Password hashing |
| **xlsx** | 0.18 | Excel import/export for sales ledger |

### Native / Desktop
| Technology | Purpose |
|---|---|
| **Electron** | Windows desktop app wrapper |
| **Tauri** (Rust) | Lightweight cross-platform desktop builds |
| **Capacitor** | Android mobile app (hybrid) |

### Testing
| Technology | Purpose |
|---|---|
| **Vitest** | Unit testing framework |
| **Playwright** | End-to-end browser testing |
| **@testing-library/react** | React component testing utilities |

### DevOps & Deployment
| Technology | Purpose |
|---|---|
| **Vercel** | Web hosting + serverless functions |
| **GitHub Actions** | CI/CD for Android APK & macOS DMG builds |
| **Firebase Console** | Firestore rules & storage rules deployment |

---

##  Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │   Web    │  │ Electron │  │  Tauri   │  │  Capacitor (APK) │    │
│  │ (Vercel) │  │ (Win32)  │  │ (macOS)  │  │    (Android)     │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘    │
│       │              │             │                  │              │
│       └──────────────┴─────────────┴──────────────────┘              │
│                              │                                       │
│                    React 19 + TypeScript                              │
│                    (Vite-bundled SPA)                                 │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
              ┌────────────────┼─────────────────┐
              │                │                  │
              ▼                ▼                  ▼
   ┌──────────────────┐  ┌─────────────┐  ┌───────────────────┐
   │  Firebase Suite  │  │ Express.js  │  │  Vercel Serverless│
   │                  │  │  (server.js)│  │  (api/send-email) │
   │  • Firestore DB  │  │             │  │                   │
   │  • Auth          │  │  • Email    │  │  • Production     │
   │  • Storage       │  │  • Uploads  │  │    email endpoint │
   │  • Analytics     │  │  • Cron     │  │                   │
   └──────────────────┘  └─────────────┘  └───────────────────┘
```

### Request Flow

1. **Public users** access the website via the Vite-served SPA. They can browse content, view packages, and submit bookings.
2. **Bookings** are written directly to **Firestore** from the client. Firestore security rules enforce access control.
3. **Emails** (booking confirmations, reminders, contact form submissions) are sent via the **Express server** (`server.js`) in development or the **Vercel serverless function** (`api/send-email.js`) in production.
4. **File uploads** (payment proof, gallery images) are handled by `multer` on the Express server or uploaded directly to **Firebase Storage** from the client.
5. **Admin users** authenticate through **Firebase Auth**, which gates access to the admin dashboard via `<ProtectedRoute>`.
6. **Cron jobs** on the Express server check every minute for upcoming sessions and send 30-minute reminder emails to both customers and admins.

---

##  Project Structure

```
ItsourStudioNew/
├── .env                        # Environment variables (NEVER committed)
├── .env.example                # Template for environment variables
├── .env.local                  # Local overrides
├── .github/
│   └── workflows/
│       ├── build_android.yml   # CI: Build Android APK via Capacitor
│       └── build_macos.yml     # CI: Build macOS DMG via Tauri
├── _legacy/                    # Archived legacy code (HTML/CSS/JS)
├── android/                    # Capacitor Android native project
├── api/
│   └── send-email.js           # Vercel serverless function for emails
├── electron/
│   └── main.cjs                # Electron main process entry
├── public/
│   ├── gallery/                # Static gallery images (solo, duo, group)
│   ├── gallery-uploads/        # User-uploaded gallery images
│   ├── logo/                   # Brand assets & favicons
│   ├── POP/                    # Payment Proof of Payment uploads
│   ├── downloads/              # Desktop app downloads
│   ├── robots.txt              # Search engine crawler rules
│   └── sitemap.xml             # XML sitemap for SEO
├── scripts/
│   ├── createAdmin.js          # Create admin user in Firebase Auth
│   ├── hashPassword.js         # Hash passwords using bcryptjs
│   ├── compress-existing-images.js  # Bulk image compression utility
│   ├── generate-icon.cjs       # Generate app icon (.ico)
│   ├── generate-notification.js # Generate test notifications
│   └── test-reminder.js        # Test the cron reminder system
├── server.js                   # Express backend (email, uploads, cron)
├── src/
│   ├── App.tsx                 # Root app component with routing
│   ├── main.tsx                # React entry point (mounts to #app)
│   ├── firebase.ts             # Firebase SDK initialization
│   ├── style.css               # Global stylesheet (~116KB)
│   ├── context/
│   │   └── BookingContext.tsx   # React Context for booking modal state
│   ├── utils/
│   │   ├── sanitize.ts         # Input sanitization & XSS prevention
│   │   ├── compressImage.ts    # Client-side image compression (Canvas API)
│   │   ├── generateReference.ts # Booking reference generator (IOS-YYMMDD-XXXX)
│   │   ├── sanitize.test.ts    # Unit tests for sanitization
│   │   └── generateReference.test.ts  # Unit tests for reference generator
│   ├── pages/
│   │   ├── Home.tsx            # Landing page (hero, gallery, about, contact)
│   │   ├── Services.tsx        # Services/packages showcase page
│   │   ├── Gallery.tsx         # Full gallery with lightbox & filtering
│   │   ├── FAQ.tsx             # Dynamic FAQ page (fetched from Firestore)
│   │   ├── BioLinks.tsx        # Linktree-style bio links page (/links)
│   │   ├── PrivacyPolicy.tsx   # Privacy policy page
│   │   ├── PatchNotes.tsx      # Release/patch notes page
│   │   ├── NotFound.tsx        # 404 error page
│   │   ├── AdminLogin.tsx      # Admin authentication page
│   │   ├── AdminDashboard.tsx  # Main admin dashboard (~2,200 lines)
│   │   ├── AdminDownload.tsx   # Desktop app download page
│   │   └── EmailTest.tsx       # Email testing utility page
│   └── components/
│       ├── Navbar.tsx          # Responsive navigation bar
│       ├── Footer.tsx          # Site footer with dynamic content
│       ├── BookingModal.tsx    # Multi-step booking form (~1,300 lines)
│       ├── BackdropVisualizer.tsx  # Interactive backdrop color viewer
│       ├── StructuredData.tsx  # JSON-LD structured data for SEO
│       ├── FeedbackModal.tsx   # Customer review submission modal
│       ├── ReportModal.tsx     # Bug/issue reporting modal
│       ├── ConfirmPopup.tsx    # Reusable confirmation dialog
│       ├── CookieConsent.tsx   # GDPR cookie consent banner
│       ├── LoadingScreen.tsx   # Animated loading/transition screen
│       ├── ScrollToTop.tsx     # Scroll restoration on navigation
│       ├── BackToTop.tsx       # Floating "back to top" button
│       ├── LazyImage.tsx       # Lazy-loaded image component
│       ├── PromoBanner.tsx     # Promotional top banner
│       ├── PromoSection.tsx    # Seasonal promo section
│       ├── BioIcon.tsx         # Icon renderer for bio links
│       └── admin/
│           ├── ContentManagement.tsx   # CMS (about, footer, promos, backdrops, FAQs)
│           ├── ServicesManagement.tsx   # CRUD for photography packages
│           ├── GalleryManagement.tsx    # Gallery image CRUD + carousel mgmt
│           ├── SalesLedger.tsx          # Financial ledger with Excel import/export
│           ├── UserManagement.tsx       # Admin user CRUD + role management
│           ├── FeedbackManagement.tsx   # Approve/reject customer testimonials
│           ├── ReportManagement.tsx     # Bug report triage & status tracking
│           ├── BioLinkManagement.tsx    # Bio links CRUD + drag-and-drop ordering
│           ├── NotificationHub.tsx      # Real-time notification dropdown
│           ├── NotificationHistory.tsx  # Full notification log with pagination
│           ├── NotificationDetailsModal.tsx  # Notification detail view
│           ├── WalkInModal.tsx          # Walk-in booking + session timer
│           └── InvoiceModal.tsx         # Payment processing & invoice modal
├── src-tauri/                  # Tauri (Rust) desktop app configuration
│   ├── tauri.conf.json         # Tauri app config
│   ├── Cargo.toml              # Rust dependencies
│   └── src/                    # Rust source files
├── tests/
│   └── booking.spec.ts         # E2E Playwright test for booking flow
├── capacitor.config.ts         # Capacitor mobile config
├── firebase.json               # Firebase project config
├── firestore.rules             # Firestore security rules
├── storage.rules               # Firebase Storage security rules
├── playwright.config.ts        # Playwright E2E test config
├── tsconfig.json               # TypeScript compiler options
├── vite.config.ts              # Vite build configuration
├── vercel.json                 # Vercel deployment & rewrite rules
├── index.html                  # HTML entry point with SEO meta tags
└── package.json                # Project metadata & dependencies
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- A **Firebase project** with Firestore, Auth, and Storage enabled
- A **Gmail account** with an App Password for email sending

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Sedictt/ItsourStudioNew.git
cd ItsourStudioNew

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# → Edit .env with your actual credentials (see next section)

# 4. Start the development server (runs both client + backend concurrently)
npm run dev
```

This starts:
- **Vite dev server** on `http://localhost:5173` (frontend)
- **Express server** on `http://localhost:3001` (backend API)

Vite is configured to proxy `/api/*` requests to the Express backend.

### First-Time Admin Setup

```bash
# Create your first admin account in Firebase Auth
node scripts/createAdmin.js
```

Then navigate to `http://localhost:5173/admin/login` and sign in.

---

## ⚙ Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```env
# ──────────────────────────────────────
# Email Configuration
# ──────────────────────────────────────
EMAIL_USER=your-email@gmail.com          # Gmail address for sending emails
EMAIL_PASS=your-app-password             # Gmail App Password (not your login password)
GCASH_NUMBER=0905 336 7103               # GCash number shown in booking emails
BUSINESS_EMAIL=itsourstudio1@gmail.com   # Business contact email

# ──────────────────────────────────────
# Admin Authentication (Server-Side)
# ──────────────────────────────────────
ADMIN_EMAIL=admin@itsourstudio.com       # Admin Firebase Auth email
ADMIN_PASSWORD=your-secure-password      # Admin Firebase Auth password

# ──────────────────────────────────────
# Firebase Configuration
# ──────────────────────────────────────
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ──────────────────────────────────────
# Server Configuration
# ──────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:5173,https://itsour-studio.vercel.app
```

> **⚠️ Security Note:** The `.env` file is gitignored. Never commit credentials to version control. The `firebase.ts` file contains hardcoded fallback values for development convenience only — in production, always use environment variables.

---

## Client-Side Application

### Public-Facing Pages

| Route | Component | Description |
|---|---|---|
| `/` | `Home.tsx` | Landing page with hero section, image carousel, about section, gallery preview, testimonials, backdrop visualizer, and contact form |
| `/services` | `Services.tsx` | Full-screen service showcase with dynamic scrolling, package details fetched from Firestore |
| `/gallery` | `Gallery.tsx` | Filterable gallery (solo/duo/group) with lightbox viewer, images from Firestore |
| `/faq` | `FAQ.tsx` | Accordion-style FAQ, content managed via admin CMS, with FAQ Schema markup |
| `/links` | `BioLinks.tsx` | Linktree-style page with customizable links, profile, and social icons |
| `/privacy-policy` | `PrivacyPolicy.tsx` | Static privacy policy page |
| `/patch-notes` | `PatchNotes.tsx` | Version history and patch notes |
| `/email-test` | `EmailTest.tsx` | Developer utility to test email sending |
| `*` | `NotFound.tsx` | Custom 404 page |

### Admin Dashboard

The admin dashboard (`/admin`) is a **single-page application within the app**, accessible only to authenticated Firebase Auth users. It is a monolithic component (`AdminDashboard.tsx`, ~2,200 lines) that renders different admin panels based on the active sidebar tab.

#### Dashboard Tabs / Sections

| Tab | Component | Functionality |
|---|---|---|
| **Dashboard** | (inline in `AdminDashboard.tsx`) | Overview stats (total bookings, revenue, pending count), booking calendar, recent inquiries, quick filters, date-based navigation |
| **Bookings** | (inline in `AdminDashboard.tsx`) | Full booking table with search, sort, filter by status, pagination, status management (confirm/reject/complete), email notifications, payment proof viewer, rejection with reason |
| **Walk-In** | `WalkInModal.tsx` | Quick-entry form for walk-in customers with session timer, conflict detection, real-time slot checking |
| **Gallery** | `GalleryManagement.tsx` | Upload, edit, categorize, and reorder gallery images, manage homepage carousel selection |
| **Content** | `ContentManagement.tsx` | Full CMS: edit About section, Footer content, Promo Banner settings, Seasonal Promo config, Backdrop color management (with color picker), FAQ editor |
| **Services** | `ServicesManagement.tsx` | Create/edit/delete photography packages, manage visibility, reorder, upload images per service, bulk load defaults |
| **Users** | `UserManagement.tsx` | Admin user CRUD with roles (admin/editor/viewer/IT), send password resets, create new admin accounts via Firebase Auth |
| **Feedback** | `FeedbackManagement.tsx` | View customer feedback, toggle testimonial visibility (approve for public display), delete |
| **Reports** | `ReportManagement.tsx` | View issue/bug reports with status tracking (new → in-progress → resolved), screenshot viewing |
| **Sales Ledger** | `SalesLedger.tsx` | Daily sales tracking spreadsheet with editable cells, Excel import/export (XLSX), walk-in slot management, financial record-keeping |
| **Bio Links** | `BioLinkManagement.tsx` | Manage the Linktree-style page: edit profile, upload images, manage links with drag-and-drop reordering, toggle active/inactive, icon selection |
| **Invoice** | `InvoiceModal.tsx` | Payment processing modal with GCash/Cash payment methods, downpayment tracking, confirmation dialogs |
| **Notifications** | `NotificationHub.tsx` / `NotificationHistory.tsx` | Real-time notification bell with dropdown, full notification log with pagination, mark read/unread, delete, navigate to related items |

### Routing

Routing is managed by **React Router DOM v7** in `App.tsx`. Key routing behaviors:

```
/                    → Home (or redirect to /admin on native platforms)
/services            → Services
/gallery             → Gallery
/faq                 → FAQ
/links               → BioLinks (no navbar/footer)
/privacy-policy      → PrivacyPolicy
/patch-notes         → PatchNotes
/admin/login         → AdminLogin
/admin               → AdminDashboard (ProtectedRoute)
/admin/download      → AdminDownload
/about               → Redirect to / with scrollTo='about'
/contact             → Redirect to / with scrollTo='contact'
*                    → NotFound (404)
```

**Platform detection:** On Capacitor (Android) or Tauri (desktop) platforms, the root route `/` automatically redirects to `/admin`, since native apps are exclusively for admin use.

**Protected routes:** The `<ProtectedRoute>` component wraps admin routes and checks `Firebase Auth` state. Unauthenticated users are redirected to `/admin/login`.

### State Management

State is managed through:

1. **React `useState` / `useEffect`** — Primary state management (no Redux/Zustand)
2. **`BookingContext`** — React Context providing `isBookingOpen`, `openBooking(packageId?)`, `closeBooking()`, and `selectedPackageId` globally, allowing any component to trigger the booking modal
3. **Firestore `onSnapshot`** — Real-time listeners for bookings, notifications, gallery items, and services provide live data updates without polling

### Shared Components

| Component | Description |
|---|---|
| `Navbar` | Responsive navigation with transparent-to-solid scroll effect, mobile hamburger menu, promo banner integration |
| `Footer` | Dynamic footer with content from Firestore, social links, report issue button |
| `BookingModal` | Multi-step booking wizard: Package selection → Date & time picker → Personal info → Payment proof upload → Confirmation. Includes real-time slot availability, date blacklisting, extension rates, file drag-and-drop |
| `BackdropVisualizer` | Interactive backdrop color preview with smooth transitions, fetched from Firestore |
| `ConfirmPopup` | Reusable confirmation dialog for destructive actions |
| `CookieConsent` | GDPR-compliant cookie consent banner |
| `LoadingScreen` | Animated brand loading screen for initial load and page transitions |
| `LazyImage` | Image component with lazy loading, placeholder, and smooth fade-in |
| `FeedbackModal` | Customer review form with star rating and sanitized input |
| `ReportModal` | Bug/issue reporting with screenshot upload to Firebase Storage |
| `PromoBanner` | Dismissible promotional banner at top of page (session-storage based) |
| `PromoSection` | Seasonal promotional section on the homepage |
| `StructuredData` | SEO JSON-LD structured data injection |
| `BioIcon` | Icon renderer supporting multiple icon types for bio links |
| `ScrollToTop` | Automatic scroll-to-top on route change |
| `BackToTop` | Floating FAB to scroll back to top |

### Utility Modules

#### `sanitize.ts` — Input Sanitization Library

A comprehensive XSS prevention library with the following functions:

| Function | Purpose |
|---|---|
| `sanitizeString(input)` | Escapes HTML special characters (`<`, `>`, `&`, `"`, `'`, `` ` ``, `/`, `=`) |
| `stripHtmlTags(input)` | Removes all HTML tags from a string |
| `sanitizeEmail(email)` | Validates and normalizes email addresses |
| `sanitizePhoneNumber(phone)` | Validates and normalizes Philippine phone numbers to `+639XXXXXXXXX` format |
| `sanitizeName(name, maxLength)` | Strips HTML, allows only name-safe characters (`A-Z`, spaces, hyphens, periods, apostrophes) |
| `sanitizeText(text, maxLength)` | Strips HTML and escapes special characters for safe display |
| `validateDate(dateStr)` | Validates date string and returns `Date` or `null` |
| `sanitizeNumber(input, min, max, fallback)` | Validates numeric input within bounds |
| `sanitizeUrl(url)` | Validates URL, only allows `http://` and `https://` protocols |
| `sanitizeFormData(data, schema)` | Bulk-sanitizes a form object based on a field-type schema |

#### `compressImage.ts` — Client-Side Image Compression

Compresses images using the browser Canvas API before upload:
- Auto-detects WebP support, falls back to JPEG
- Resizes to max 1920×1080
- Adjusts quality dynamically based on pixel count (0.7–0.75)
- Logs compression ratio for debugging

#### `generateReference.ts` — Booking Reference Generator

Generates booking reference numbers in the format `IOS-YYMMDD-XXXX`:
- `IOS` = It's ouR Studio prefix
- `YYMMDD` = Date
- `XXXX` = Random 4-character alphanumeric suffix (excludes confusing chars: 0, O, 1, I)

---

## Server-Side Application

The Express backend (`server.js`) runs on port **3001** and provides three core services:

### API Endpoints

#### `POST /upload` — Payment Proof Upload
- **Rate limit:** 10 requests per 15 minutes per IP
- **Max file size:** 10 MB
- **Storage:** `public/POP/` directory
- **Response:** `{ message, path }`

#### `POST /upload/gallery` — Gallery Image Upload
- **Rate limit:** 10 requests per 15 minutes per IP
- **Max file size:** 15 MB
- **Storage:** `public/gallery-uploads/` directory
- **Response:** `{ message, path }`

#### `POST /send-email` — Email Dispatch
- **Rate limit:** 20 requests per hour per IP
- **Supported types:**
  | Type | Recipient | Purpose |
  |---|---|---|
  | `confirmed` | Customer email | Booking confirmation with "Session Pass" design |
  | `received` | Customer email | Booking received with GCash QR payment instructions |
  | `rejected` | Customer email | Booking rejection with admin reason |
  | `contact` | Business email | Contact form inquiry forwarded to admin |
  | `report_issue` | IT team email | System issue report with optional screenshot |

### Email System

All emails use **professionally designed HTML templates** with:
- Responsive inline CSS
- Brand colors (`#bf6a39`)
- Emoji-enhanced visual hierarchy
- Ticket-stub design for confirmations
- Payment card design for downpayment instructions
- GCash QR code attachment (CID-embedded image)

Email is sent via **Nodemailer** using Gmail SMTP with app password authentication.

### Cron Jobs & Reminders

A **node-cron** job runs every minute and checks Firestore for confirmed bookings starting in 30 minutes:

```
Schedule: * * * * * (every minute)
Timezone: Asia/Manila (UTC+8)
```

**Flow:**
1. Calculate `now + 30 minutes` in Manila time
2. Query Firestore for bookings with matching `date`, `time`, and `status == 'confirmed'`
3. Send reminder email to **customer** ("Your Session in 30 Minutes!")
4. Send alert email to **admin** ("Upcoming Session Alert")

The server authenticates to Firestore using Firebase client SDK with admin credentials from `.env`.

---

##  Vercel Serverless API

For production deployment on Vercel, the email functionality is duplicated as a serverless function:

**`api/send-email.js`**

This is a standalone Vercel serverless function that handles the same email types as the Express endpoint but runs in Vercel's Lambda-like environment. It includes:

- All 7 email templates (received, confirmed, rejected, contact, reminder, new booking admin alert, report)
- Shared reusable HTML style system
- Same Nodemailer SMTP configuration
- CORS headers for cross-origin requests

**Vercel Rewrites** (`vercel.json`):
```json
{ "source": "/api/(.*)", "destination": "/api/$1" }
{ "source": "/(.*)", "destination": "/index.html" }
```

> **Note:** The cron reminder system only runs on the Express server (`server.js`), not on Vercel serverless. For production reminders, you would need a separate hosting solution for the server or use Vercel Cron Jobs.

---

##  Firebase Integration

### Firestore Collections

| Collection | Description | Access Pattern |
|---|---|---|
| `users` | Admin user profiles (name, email, role, status) | Auth required for read/write |
| `bookings` | Customer bookings (name, email, phone, package, date, time, status, price, payment proof, notes) | Public create; Auth for admin |
| `booked_slots` | Simplified booked time slots (no PII) for public availability checking | Public read/create; Auth for write |
| `feedbacks` | Customer reviews (name, rating, message, testimonial visibility) | Public create/read; Auth for admin |
| `gallery` | Gallery image metadata (src, category, alt, carousel flag, order) | Public read; Auth for write |
| `siteContent` | CMS content documents: `about`, `footer`, `promoBanner`, `seasonalPromo`, `faq` | Public read; Auth for write |
| `unavailableDates` | Blacklisted dates for the booking calendar | Public read; Auth for write |
| `backdrops` | Backdrop color definitions (hex, name, description, order) | Public read; Auth for write |
| `bioLinks` | Bio link entries (title, URL, icon, active status, order) | Public read; Auth for write |
| `reports` | Bug/issue reports (type, description, email, status, screenshot URL) | Public create; Auth for admin |
| `services` | Photography packages (title, price, duration, features, images, visibility, order) | Public read; Auth for write |
| `notifications` | System notifications (type, title, message, read status, related ID) | Public create; Auth for admin |

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  // Users: Auth required for all operations
  // Bookings: Public create, Auth for all other operations
  // Booked Slots: Public read/create, Auth for writes
  // Feedbacks: Public create/read, Auth for update/delete
  // Gallery, Site Content, Backdrops, Bio Links, Services, Unavailable Dates:
  //   Public read, Auth required for write
  // Reports, Notifications: Public create, Auth for read/write
  // Default: deny all
}
```

### Firebase Storage

| Bucket Path | Access | Max Size | Purpose |
|---|---|---|---|
| `gallery/**` | Public read, Auth write | — | Gallery images uploaded via admin |
| `services/**` | Public read, Auth write | — | Service package images |
| `reports/{item}` | Auth read, Public create | — | Bug report screenshots |

### Storage Security Rules

```
rules_version = '2';
service firebase.storage {
  // gallery/**: Public read, Admin write
  // services/**: Public read, Admin write
  // reports/{item}: Public create, Admin read/update/delete
  // Default: deny all
}
```

### Firebase Authentication

- Uses **Email/Password** authentication method
- Admin users are created via the `scripts/createAdmin.js` utility or the admin User Management panel
- The `onAuthStateChanged` listener in `<ProtectedRoute>` gates access to admin routes
- Server-side authentication uses `signInWithEmailAndPassword` for Firestore access in the cron job

---

## Multi-Platform Support

### Web (Vercel)

The primary deployment target. The SPA is built with `vite build` and deployed to Vercel with rewrites for client-side routing.

- **Production URL:** `https://itsourstudio.net` / `https://itsour-studio.vercel.app`
- **Build command:** `tsc && vite build`
- **Output directory:** `dist/`

### Desktop — Electron

A lightweight Electron wrapper that loads the live production URL (`https://itsourstudio.net/admin/login`), providing a native Windows desktop experience.

```bash
# Development
npm run electron:dev

# Build installer (NSIS)
npm run electron:build
```

**Features:**
- Maximized window on launch (1200×800 default)
- Custom app icon
- Windows NSIS installer with customizable install directory

### Desktop — Tauri

A more lightweight alternative to Electron using Rust. Used primarily for macOS builds via CI/CD.

```bash
# Development
npm run tauri:dev

# Production build
npm run tauri:build
```

**Config:** `src-tauri/tauri.conf.json`
- App ID: `com.itsourstudio.admin`
- Maximized window, 1200×800 default
- Targets: DMG, MSI, AppImage

### Mobile — Capacitor (Android)

A Capacitor-based hybrid mobile app that wraps the web application.

```bash
# Open in Android Studio
npm run mobile:open

# Sync native project after web build
npx cap sync android
```

**Config:** `capacitor.config.ts`
- App ID: `com.itsourstudio.admin`
- App Name: `IoS Admin`
- Web Directory: `dist`

---

## CI/CD Pipelines

### GitHub Actions: Build Android APK

**File:** `.github/workflows/build_android.yml`
**Triggers:** Push/PR to `main` or `master`

**Pipeline:**
1. Checkout → Install Node 22 → `npm install`
2. `npm run build` → `npx cap sync android`
3. Set up JDK 21 + Android SDK
4. `./gradlew assembleDebug`
5. Upload `app-debug.apk` as artifact

### GitHub Actions: Build macOS App

**File:** `.github/workflows/build_macos.yml`
**Triggers:** Push to `main` or manual dispatch

**Pipeline:**
1. Checkout → Install Node 20 + Rust toolchain (x86_64-apple-darwin)
2. `npm ci` → Build via `tauri-apps/tauri-action@v0`
3. Upload `.dmg` as artifact

---

##  Testing

### Unit Tests (Vitest)

```bash
npm test
```

Tests are located in `src/utils/` alongside the source files:

| Test File | Coverage |
|---|---|
| `sanitize.test.ts` | All sanitization functions (string, email, phone, name, text, URL, number, date, formData) |
| `generateReference.test.ts` | Reference format validation, uniqueness checks |

### End-to-End Tests (Playwright)

```bash
npm run test:e2e
```

**Config:** `playwright.config.ts`
- Runs against `http://localhost:5173`
- Auto-starts dev server
- Tests on Chromium, Firefox, and WebKit
- HTML reporter
- Trace collection on first retry

**Test files:**
- `tests/booking.spec.ts` — End-to-end booking flow

---

##  SEO & Structured Data

The application implements comprehensive SEO best practices:

### HTML Meta Tags (`index.html`)
- Title, description, keywords
- Canonical URL
- Open Graph (Facebook) tags with image
- Twitter Card tags
- Google Fonts preconnect

### Structured Data (`StructuredData.tsx`)

Three JSON-LD schemas are injected on every page:

1. **`ProfessionalService`** — Business info, address, hours, pricing, aggregate rating, service offers, social links
2. **`Organization`** — Logo, contact point, area served
3. **`BreadcrumbList`** — Navigation structure (Home → Services → Gallery)

### FAQ Schema (`FAQ.tsx`)

Dynamically generates **`FAQPage`** schema markup from Firestore-managed FAQ content.

### Additional SEO Assets

- `public/robots.txt` — Allows crawling, disallows `/admin/*`
- `public/sitemap.xml` — XML sitemap with 5 primary pages

---

##  Security Measures

| Layer | Implementation |
|---|---|
| **Input Sanitization** | `sanitize.ts` library applied to all user inputs (booking forms, contact form, feedback, reports) |
| **XSS Prevention** | HTML escaping, tag stripping, URL protocol validation |
| **Authentication** | Firebase Auth with email/password |
| **Route Protection** | `<ProtectedRoute>` component with `onAuthStateChanged` listener |
| **API Rate Limiting** | `express-rate-limit` on upload (10/15min) and email (20/hr) endpoints |
| **CORS** | Origin whitelist via `ALLOWED_ORIGINS` environment variable |
| **Firestore Rules** | Auth-gated writes for all admin collections; public read for content |
| **Storage Rules** | Auth-gated writes; public read for gallery/services |
| **File Upload Limits** | 10MB for payment proofs, 15MB for gallery images |
| **Filename Sanitization** | Special characters stripped from uploaded filenames |
| **Password Hashing** | `bcryptjs` for any stored passwords |
| **Environment Variables** | All credentials in `.env` (gitignored) with fallbacks only for dev |
| **Phone Validation** | Philippine number format enforcement (+639XXXXXXXXX) |

---

##  Scripts & Utilities

| Script | Command | Purpose |
|---|---|---|
| `createAdmin.js` | `node scripts/createAdmin.js` | Create a new admin user in Firebase Auth & Firestore |
| `hashPassword.js` | `node scripts/hashPassword.js` | Hash a password string using bcryptjs |
| `compress-existing-images.js` | `node scripts/compress-existing-images.js` | Bulk compress images in the gallery directory |
| `generate-icon.cjs` | `node scripts/generate-icon.cjs` | Convert PNG logo to ICO format for desktop apps |
| `generate-notification.js` | `node scripts/generate-notification.js` | Insert test notifications into Firestore |
| `test-reminder.js` | `node scripts/test-reminder.js` | Manually trigger the reminder system for testing |
| `test-email-local.js` | `node test-email-local.js` | Test email sending locally |
| `verify-smtp.js` | `node verify-smtp.js` | Verify SMTP connection and credentials |

---

##  Available NPM Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start both client (Vite) and server (Express) concurrently |
| `client` | `npm run client` | Start Vite dev server only |
| `server` | `npm run server` | Start Express server only |
| `dev:host` | `npm run dev:host` | Start with `--host` flag (LAN accessible for mobile testing) |
| `build` | `npm run build` | TypeScript check + Vite production build |
| `preview` | `npm run preview` | Preview the production build locally |
| `electron:dev` | `npm run electron:dev` | Start Electron in development mode |
| `electron:build` | `npm run electron:build` | Build Electron installer |
| `tauri:dev` | `npm run tauri:dev` | Start Tauri in development mode |
| `tauri:build` | `npm run tauri:build` | Build Tauri production bundle |
| `mobile:open` | `npm run mobile:open` | Open Android project in Android Studio |
| `test` | `npm run test` | Run Vitest unit tests |
| `test:e2e` | `npm run test:e2e` | Run Playwright E2E tests |

---

##  Deployment

### Vercel (Web — Primary)

1. Connect the GitHub repository to Vercel
2. Set all environment variables from `.env.example` in the Vercel project settings
3. Vercel auto-detects Vite and builds with `npm run build`
4. Rewrites in `vercel.json` handle SPA routing and API proxy

### Firebase Rules

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Storage security rules
firebase deploy --only storage:rules
```

### Desktop Builds

```bash
# Windows (Electron)
npm run electron:build
# Output: release/Its Our Studio Admin Setup *.exe

# macOS (Tauri) — via CI/CD only
# Push to main → GitHub Actions builds DMG

# Windows (Tauri)
npm run tauri:build
# Output: src-tauri/target/release/bundle/
```

### Android Build

```bash
npm run build
npx cap sync android
npm run mobile:open
# → Build APK/AAB from Android Studio
```

Or via CI/CD: Push to `main` → GitHub Actions builds debug APK.

---

##  Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Ensure all tests pass: `npm test`
4. Commit with descriptive messages
5. Push and open a Pull Request

### Development Conventions

- **TypeScript** for all `.tsx` / `.ts` files
- **Vanilla CSS** for styling (no Tailwind / CSS-in-JS)
- **Functional components** with React hooks exclusively
- **Firestore real-time listeners** (`onSnapshot`) for live data
- **Input sanitization** before any Firestore write
- **Component co-location** — CSS files alongside their component

---

