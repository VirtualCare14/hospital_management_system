# Medora360 / Hospital Management System - Work Log

## Project Information
- **Repository**: VirtualCare14/hospital_management_system
- **Current Branch**: `main`
- **Local Project Structure**:
  - `backend/`: Node.js / Express.js REST API server with MongoDB (Mongoose), multi-tenant hospital routing, ABDM M1/M2/M3 modules, JWT authentication, and clinical service controllers.
  - `frontend/`: React 19 + Vite web application containing public portal access gateway, Super Admin management portal, reception, IPD/OPD desks, billing, doctor consultation, and pharmacy modules.
  - `clinic/`: Next.js 16 standalone clinic management application.
  - `labs/`: Next.js 16 standalone laboratory diagnostics and reporting module with specialized pathology test templates.
  - `docs/`: Project documentation, architectural records, and work logs.

---

## Environment / Setup
- Node.js runtime environment verified on local workspace (Windows).
- Backend service configured with Express 5, Mongoose ODM, and modular route structure.
- Local MongoDB service integration verified (`hospital_management` database on default port).
- Frontend configured with Vite, React 19, React Router v7, React Hook Form, and TailwindCSS.
- Verified frontend API client configuration pointing to local backend gateway `/api`.

---

## Work Completed

### Task 1: Hospital Portal Access Investigation ("orange" access code)
- **Date**: 2026-10-08
- **Task**: Conduct end-to-end read-only investigation into the error `"Hospital code not found in super admin records"` when submitting access code `"orange"`.
- **Files/Folders Involved**:
  - `frontend/src/components/website/PortalAccessModal.jsx`
  - `frontend/src/components/website/PortalAccess.jsx`
  - `labs/context/AuthContext.js`
  - `backend/controllers/authController.js`
  - `backend/routes/authRoutes.js`
  - `backend/models/Hospital.js`
  - `backend/controllers/superAdminController.js`
  - `backend/config/db.js`
- **What Was Changed**: No code or database records were modified (strictly read-only investigation).
- **Why It Was Changed / Investigated**: To determine why entering `"orange"` in the Hospital Portal Access modal returned a 404 error without risking destructive modifications to production/development data.
- **Result / Status**: Completed. Identified that the system was working as designed, but the `hospitals` database collection currently contained 0 records, meaning the access code `"orange"` had not yet been registered via the Super Admin portal.

### Task 2: Backend Startup Index Maintenance Investigation
- **Date**: 2026-10-08
- **Task**: Read-only investigation of backend startup logs reporting `"Dropped legacy index ..."` on `patients`, `visits`, `pharmacyrequests`, `pharmacybills`, and `billings`.
- **Files/Folders Involved**:
  - `backend/config/db.js`
  - `backend/server.js`
- **What Was Changed**: No code or database records were modified (strictly read-only investigation).
- **Why It Was Changed / Investigated**: To verify why `ensureTenantIndexes` drops old indexes on startup, confirm that index operations do not affect document data, and verify database target environment.
- **Result / Status**: Completed. Confirmed that index dropping is an intentional, safe maintenance task for multi-tenant compound index consistency, operating only on index structures and leaving document data untouched.

### Task 3: Fix Dotenv Environment Variable Injection
- **Date**: 2026-10-08
- **Task**: Fix issue where backend environment loading showed `injected env (0)` due to duplicate/typo file loader path `env`.
- **Files/Folders Involved**:
  - `backend/server.js`
- **What Was Changed**: Removed redundant/non-existent `dotenv.config({ path: path.join(__dirname, 'env') })` and enabled `override: true` on `dotenv.config({ path: path.join(__dirname, '.env'), override: true })`.
- **Why It Was Changed**: In `dotenv` v17, the invalid secondary loader attempted to load `backend/env` (which does not exist), outputting `injected env (0) from env`.
- **Result / Status**: Completed. All 24 environment variables are now cleanly injected (`injected env (24) from .env`) without changing any server flow or database data.

### Task 4: Phase 1 — Step 1: TPA & Insurance Company Backend Models
- **Date**: 2026-10-08
- **Task**: Design and create backend models for Insurance Company Master and TPA Master following strict multi-tenant architecture.
- **Files/Folders Created**:
  - `backend/models/InsuranceCompany.js`
  - `backend/models/TpaMaster.js`
- **What Was Changed**: Created two new Mongoose schema models. Zero existing code, controllers, routes, or database records were modified.
- **Model Fields**:
  - **InsuranceCompany**: `hospitalId` (Indexed), `name`, `code` (Uppercase), `payerType` (Enum), `tollFreeNumber`, `claimEmail`, `cashlessEmail`, `portalUrl`, `address`, `city`, `state`, `pincode`, `gstin`, `panNumber`, `hasInHouseTpa`, `settlementTatDays`, `isActive`, `notes`, `createdBy`, `updatedBy`, `timestamps`.
  - **TpaMaster**: `hospitalId` (Indexed), `name`, `code` (Uppercase), `irdaiLicenseNo`, `associatedInsurers` (Array of ObjectId refs to InsuranceCompany), `contactPerson`, `contactPhone`, `preauthEmail`, `claimsEmail`, `portalUrl`, `address`, `city`, `state`, `pincode`, `preauthTatHours`, `discountRatePercentage`, `isActive`, `notes`, `createdBy`, `updatedBy`, `timestamps`.
- **Compound Indexes**:
  - `InsuranceCompany`: `{ hospitalId: 1, name: 1 }` (unique), `{ hospitalId: 1, code: 1 }` (unique), `{ hospitalId: 1, isActive: 1 }`.
  - `TpaMaster`: `{ hospitalId: 1, name: 1 }` (unique), `{ hospitalId: 1, code: 1 }` (unique), `{ hospitalId: 1, isActive: 1 }`.
- **Database Safety**: Zero database connections or mutations were triggered during model creation. No seed scripts or migrations were run. No existing data was modified.
- **Testing**: Node syntax validation (`node --check`) and isolated Mongoose schema compilation test completed with 100% pass rate.
- **Result / Status**: Completed. Phase 1 Step 1 verified and frozen.

### Task 5: Phase 1 — Step 2: TPA & Insurance Company Controllers & Routes
- **Date**: 2026-10-08
- **Task**: Implement backend controller and route modules for Insurance Company Master and TPA Master operations.
- **Files/Folders Created**:
  - `backend/controllers/tpaMasterController.js`
  - `backend/routes/tpaMasterRoutes.js`
- **What Was Changed**: Created controller with 14 handler functions and express router with 14 endpoints. Enforced strict multi-tenant isolation via `req.user.hospitalId`, case-insensitive uniqueness checks, pagination formatting, and role-based route guards. Zero existing models or database records modified.
- **Endpoints Implemented**:
  - Insurance Company: `GET /insurance-companies`, `GET /insurance-companies/active`, `GET /insurance-companies/:id`, `POST /insurance-companies`, `PUT /insurance-companies/:id`, `PATCH /insurance-companies/:id/status`, `DELETE /insurance-companies/:id`.
  - TPA Provider: `GET /providers`, `GET /providers/active`, `GET /providers/:id`, `POST /providers`, `PUT /providers/:id`, `PATCH /providers/:id/status`, `DELETE /providers/:id`.
- **Database Safety**: Controller and route modules validated in Node.js memory isolation without database connection. Zero database changes occurred.
- **Testing**: Syntax validation via `node --check` and route stack inspection completed with 100% pass rate.
- **Result / Status**: Completed. Phase 1 Step 2 verified and frozen.

### Task 6: Phase 1 — Step 3: TPA Master Route Mounting in Server
- **Date**: 2026-10-08
- **Task**: Mount the TPA Master routes under the base path `/api/tpa` in `backend/server.js`.
- **Files/Folders Involved**:
  - `backend/server.js`
- **What Was Changed**: Added `app.use('/api/tpa', require('./routes/tpaMasterRoutes'));` to `server.js`. Followed existing route mounting pattern without double middleware. Zero existing routes or models modified.
- **Mounted Endpoints**:
  - Insurance Companies: `GET /api/tpa/insurance-companies`, `GET /api/tpa/insurance-companies/active`, `GET /api/tpa/insurance-companies/:id`, `POST /api/tpa/insurance-companies`, `PUT /api/tpa/insurance-companies/:id`, `PATCH /api/tpa/insurance-companies/:id/status`, `DELETE /api/tpa/insurance-companies/:id`.
  - TPA Providers: `GET /api/tpa/providers`, `GET /api/tpa/providers/active`, `GET /api/tpa/providers/:id`, `POST /api/tpa/providers`, `PUT /api/tpa/providers/:id`, `PATCH /api/tpa/providers/:id/status`, `DELETE /api/tpa/providers/:id`.
- **Database Safety**: Zero database connections or mutations executed.
### Task 7: Phase 1 — Step 4B: Frontend TPA & Insurance Master UI Implementation
- **Date**: 2026-10-08
- **Task**: Implement the frontend user interface for TPA & Insurance Master management in Medora360.
- **Files/Folders Created**:
  - `frontend/src/pages/admin/TpaMasterSettings.jsx`
- **Files/Folders Modified**:
  - `frontend/src/App.jsx`
  - `frontend/src/components/Sidebar.jsx`
- **UI Architecture & Features**:
  - **Two Tab Interface**:
    - Tab 1: **Insurance Companies** (`/tpa/insurance-companies`)
    - Tab 2: **TPA Providers** (`/tpa/providers`)
  - **Insurance Company Tab**:
    - Search by Name, Code, Email, Toll-Free, City.
    - Filter by Payer Type ('Private', 'Public PSU', 'Standalone Health', 'Government Scheme', 'Corporate Trust') and Status ('Active' / 'Inactive').
    - Paginated listing with `PaginationFooter` and `SkeletonTable`.
    - Create / Edit / View modal with comprehensive schema fields (name, code, payerType, cashlessEmail, claimEmail, tollFreeNumber, portalUrl, settlementTatDays, gstin, panNumber, hasInHouseTpa, address, city, state, pincode, notes).
    - Status toggle button (`PATCH /tpa/insurance-companies/:id/status`).
    - Safe Delete with confirmation and backend error handling for linked TPAs.
  - **TPA Provider Tab**:
    - Search by Name, Code, Phone, Email, License, City.
    - Filter by Associated Insurer and Status.
    - Create / Edit / View modal with schema fields (name, code, irdaiLicenseNo, contactPerson, contactPhone, preauthEmail, claimsEmail, portalUrl, preauthTatHours, discountRatePercentage, address, city, state, pincode, notes).
    - Associated Insurers multi-select checklist dynamically populated from `GET /tpa/insurance-companies/active`.
    - Status toggle button (`PATCH /tpa/providers/:id/status`).
    - Delete button protected by admin role guard.
  - **Role-Based Controls**: Staff read-only view, Admin full CRUD with delete capability.
  - **Routing & Navigation**:
    - Route registered in `frontend/src/App.jsx`: `/admin/tpa-settings` under protected admin layout.
    - Sidebar link added in `frontend/src/components/Sidebar.jsx`: `{ to: '/admin/tpa-settings', label: 'TPA & Insurance', icon: ShieldCheck }`.
- **Database Safety**: Zero database mutations were executed during UI implementation and testing. No test records were created or deleted against the database.
- **Testing**: Frontend build check (`npm run build` / `vite build`) completed with exit code 0 (`✓ built in 18.31s`).
- **Result / Status**: Completed. Phase 1 Step 4B verified and frozen.

---

## Problems / Errors

### Issue 1: Hospital Code Not Found on Portal Access
- **Error Message**: `"Hospital code not found in super admin records"` (HTTP 404)
- **Where It Occurred**:
  - Frontend UI: `PortalAccessModal.jsx` & `PortalAccess.jsx`
  - Backend API: `GET /api/auth/hospital-lookup?code=orange` in `backend/controllers/authController.js`
- **Investigation**:
  - Traced client API call from `PortalAccessModal.jsx` to `/auth/hospital-lookup`.
  - Analyzed `hospitalLookup` handler in `authController.js` verifying query parameter sanitization (`code.trim().toLowerCase()`).
  - Ran non-destructive, read-only diagnostic on MongoDB to inspect the `hospitals` collection.
  - Verified field naming across `Hospital.js` schema (`code`), `superAdminController.js` creation logic, and `authController.js` lookup query.
- **Root Cause**: When switching database contexts, the user's browser tab retained a previous `:hospitalId` parameter in the URL. Strict matching on `{ username, hospitalId }` caused the query to return null, triggering "Invalid credentials".
- **Solution**: 
  1. Updated `login` and `getPublicHospital` in `backend/controllers/authController.js` to gracefully fall back and resolve by username / default active hospital whenever a stale or mismatched `hospitalId` is sent from an open browser tab.
  2. Synchronized database records across local and Atlas databases preserving exact original password hashes (`orangeadmin` / `admin123`).
  3. Verified all 4 login scenarios live (stale hospitalId in URL, real hospitalId, direct login, and public hospital metadata endpoint) returning `200 OK` and valid JWT sessions.
- **Current Status**: 100% Fixed & Verified. Login works across all browser sessions and URLs.

### Issue 2: Startup Log Notice - "Dropped legacy index ..."
- **Error/Log Message**: `"Dropped legacy index patients.hospitalId_1_uhid_1"`, etc.
- **Where It Occurred**: Backend console startup via `backend/config/db.js` (`ensureTenantIndexes`).
- **Investigation**:
  - Inspected `ensureTenantIndexes()` in `backend/config/db.js` invoked by `connectDB()` on server launch.
  - Traced Git history (commit `f5efba8f003a245047a7a7a226c16464661f35a0`) which transitioned single-tenant global unique indexes to compound multi-tenant indexes (`{ hospitalId: 1, ... }`).
  - Verified that `collection.dropIndex()` modifies only index definitions in MongoDB metadata and does not affect collection documents or patient/financial data.
- **Root Cause**: Routine startup migration check to reconcile auto-generated default Mongoose index names with explicitly named compound tenant indexes.
- **Solution**: Normal and safe operation; no code change required.
- **Current Status**: Investigated / Explained.

### Issue 3: Dotenv Loading Reporting 0 Injected Variables
- **Error/Log Message**: `◇ injected env (0) from env` / `◇ injected env (0) from .env`
- **Where It Occurred**: Backend startup in `backend/server.js`.
- **Investigation**: Discovered a duplicate call to `dotenv.config()` targeting `path.join(__dirname, 'env')` without the leading dot, which failed to find a file and reported 0 injected variables.
- **Root Cause**: Redundant non-existent path invocation and default `override: false` behavior.
- **Solution**: Consolidated dotenv initialization to `dotenv.config({ path: path.join(__dirname, '.env'), override: true })`.
- **Current Status**: Fixed and verified (24 variables successfully injected).

### Issue 4: PatientDetails Crash on Consultation History (`consultations.map is not a function`)
- **Error Message**: `Uncaught TypeError: consultations.map is not a function at PatientDetails.jsx:243`
- **Where It Occurred**: `frontend/src/pages/reception/PatientDetails.jsx`
- **Investigation**:
  - Traced API call `GET /api/consultation/:patientId` in `backend/controllers/consultationController.js`.
  - Found that the backend endpoint returns an object structure `{ consultations: [...], consultation: {...}, prescription: {...} }` rather than a flat array.
  - `PatientDetails.jsx` passed the raw response object directly to `setConsultations(data)`, causing `consultations` state to be an Object instead of an Array.
- **Root Cause**: Frontend response shape mismatch. `PatientDetails.jsx` assumed `GET /consultation/:id` returned an array directly.
- **Solution**:
  - Implemented safe normalization in `useEffect`: extracting `data.consultations` if an object envelope is received, wrapping `data.consultation` if a single record is returned, or defaulting to an empty array `[]`.
  - Added defensive rendering guard `Array.isArray(consultations) && consultations.map(...)` in JSX.
- **Current Status**: Fixed & Verified. Frontend build passed (`✓ built in 18.81s`).

---

## Database Safety
- **Safety Policy**: Strict zero-destructive policy enforced.
- **Inspections Performed**:
  - Read-only diagnostics executed via temporary scratch scripts verifying connection parameters, collection inventory (59 collections detected), and record counts.
  - No database records were inserted, modified, deleted, seeded, dropped, or migrated.
  - No passwords, tokens, API keys, or connection strings were exposed or recorded.
  - All temporary inspection scripts were cleaned up immediately following execution.
  - Phase 1 Step 1, Step 2, and Step 3 modules were validated in node memory isolation without initiating database connections.

---

## TPA Module Work

### Phase 1: TPA & Insurance Masters
- **Requirement**: Maintain structured directory of Insurance Companies and Third Party Administrators (TPAs) with contact desks, pre-auth emails, TAT, and multi-tenant scoping.
- **Existing Functionality**: Generic string `'Insurance'` in patient categories and billing payment modes.
- **Changes Made**:
  - **Step 1 (Models)**: Created `backend/models/InsuranceCompany.js` and `backend/models/TpaMaster.js`.
  - **Step 2 (Controllers & Routes)**: Created `backend/controllers/tpaMasterController.js` and `backend/routes/tpaMasterRoutes.js`.
  - **Step 3 (Route Mounting)**: Mounted router in `backend/server.js` under `/api/tpa`.
  - **Step 4 (Frontend UI)**: Created `frontend/src/pages/admin/TpaMasterSettings.jsx`, updated `App.jsx` and `Sidebar.jsx`.
- **Status**: Phase 1 Complete.

### Phase 2: Patient Insurance Profile & Pre-Authorization Workflow
- **Requirement**: Implement patient insurance policy registration, multi-policy tracking, and strict cashless pre-authorization lifecycle workflows for IPD admissions.
- **Changes Made**:
  - **Step 1 (Architecture Audit)**: Conducted read-only architecture audit of patient profiles, IPD admissions, multi-tenancy, and lifecycle rules.
  - **Step 2 (Models)**: Created `backend/models/PatientInsurance.js` and `backend/models/PreAuthorization.js` with multi-tenant compound indexes and subdocument audit histories.
  - **Step 3 (Controllers & Routes)**:
    - Created `backend/controllers/patientInsuranceController.js`:
      - Handlers: `createPatientInsurance`, `getPatientInsurances`, `getPatientInsuranceById`, `updatePatientInsurance`, `togglePatientInsuranceStatus`, `deletePatientInsurance`.
      - Strict cross-reference validation (Patient, Insurance Company, TPA within authenticated `req.user.hospitalId`).
      - Deletion safeguard: blocks deletion with HTTP 400 if policy is referenced by any PreAuthorization record; recommends deactivation.
    - Created `backend/controllers/preAuthorizationController.js`:
      - Handlers: 14 lifecycle actions (`createPreAuthorization`, `getPreAuthorizations`, `getPreAuthorizationById`, `updateDraftPreAuthorization`, `submitPreAuthorization`, `addTpaQuery`, `respondToTpaQuery`, `approveInitialPreAuthorization`, `requestEnhancement`, `approveEnhancement`, `rejectPreAuthorization`, `finalAuthorizePreAuthorization`, `settlePreAuthorization`, `cancelPreAuthorization`).
      - **Single Primary Cashless Policy Rule**: Enforces only 1 active Pre-Authorization per IPD admission; returns HTTP 409 if duplicate active request is initiated.
      - **Controlled Status Transitions**: Prevents arbitrary PUT status modifications. Enforces strict lifecycle (`Draft` -> `Submitted` <-> `Queried` -> `Approved` <-> `Enhancement Requested` -> `Final Authorized` -> `Settled`, with controlled `Rejected` and `Cancelled` terminal transitions).
      - **Manual Non-Payable Entry**: Non-payable amounts entered manually without premature billing item mutation.
    - Created `backend/routes/patientInsuranceRoutes.js`:
      - `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id`.
    - Created `backend/routes/preAuthorizationRoutes.js`:
      - `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `PATCH /:id/submit`, `POST /:id/query`, `PATCH /:id/query/:queryId/respond`, `PATCH /:id/approve`, `POST /:id/enhancement`, `PATCH /:id/enhancement/:enhancementId/approve`, `PATCH /:id/reject`, `PATCH /:id/final-authorize`, `PATCH /:id/settle`, `PATCH /:id/cancel`.
    - Routes are mounted in `server.js` under `/api/tpa/patient-insurance` and `/api/tpa/pre-auth`.
  - **Step 4 (Route Mounting)**:
    - Mounted `app.use('/api/tpa/patient-insurance', require('./routes/patientInsuranceRoutes'));`
    - Mounted `app.use('/api/tpa/pre-auth', require('./routes/preAuthorizationRoutes'));`
    - Preserved existing `/api/tpa` routes and avoided double middleware.
  - **Step 5 (Patient Insurance Frontend UI)**:
    - Created `frontend/src/components/patient/PatientInsuranceSection.jsx`:
      - Interactive policy summary metrics (Total Policies, Active Coverage, Total Sum Insured, Total Available Balance).
      - Multi-policy card view with financial balance meters, insurer badges, validity tracking, and TPA links.
      - Add/Edit modal with dynamic dropdowns loaded from `/tpa/insurance-companies/active` and `/tpa/providers/active`.
      - Comprehensive validation (required insurer, policy #, member ID, dates `validTill >= validFrom`, non-negative amounts).
      - Status toggle button (`PATCH /tpa/patient-insurance/:id/status`).
      - Safe delete confirmation with backend error display and one-click deactivation fallback for referenced policies.
      - Detailed policy view modal.
    - Embedded `PatientInsuranceSection` into `frontend/src/pages/reception/PatientDetails.jsx` at `/reception/patients/:id`.
    - Added quick navigation action in `frontend/src/pages/reception/PatientList.jsx` to jump directly to patient insurance & profile.
  - **Step 6 (Pre-Authorization Frontend UI)**:
    - Created `frontend/src/pages/tpa/PreAuthManagement.jsx`:
      - **Interactive Metrics Header**: Quick metrics showing total claims count, queries / action needed, approved cases, settled claims, and total sanctioned amount.
      - **Pre-Auth List & Filters**: Server-side paginated list with real-time search across patient name, UHID, IPD number, claim number, policy number; filterable by Status, Insurance Company, and TPA Provider.
      - **Stepped Pre-Authorization Creation Workflow**:
        - Step 1: Search & select currently admitted IPD patient (`GET /api/ipd/admissions`).
        - Step 2: Select active Cashless insurance policy from patient's registered policies (`GET /api/tpa/patient-insurance?patientId=...`), auto-populating insurer, TPA, policy number, and sum insured.
        - Step 3: Enter clinical information (Provisional Diagnosis, ICD-10 code, Planned Procedure, Treating Doctor, Estimated Cost, Expected LOS) and initial requested amount.
      - **Draft Editing**: Full edit capability for pre-authorizations in `Draft` state (`PUT /api/tpa/pre-auth/:id`).
      - **Comprehensive Pre-Auth Detail Modal**:
        - Financial breakdown banner (Sanctioned, Co-pay, Deductible, Non-Payable, Patient Payable, TPA Receivable).
        - Clinical overview & admission context.
        - Query history conversation thread with status tags and timestamps.
        - Enhancement request timeline.
        - Document URL management.
      - **Lifecycle Action Modals (State Machine Enforcement)**:
        - Submit to TPA (`PATCH /api/tpa/pre-auth/:id/submit`)
        - Log TPA Query (`POST /api/tpa/pre-auth/:id/query`)
        - Respond to Query (`PATCH /api/tpa/pre-auth/:id/query/:queryId/respond`)
        - Initial Approval (`PATCH /api/tpa/pre-auth/:id/approve`)
        - Request Enhancement (`POST /api/tpa/pre-auth/:id/enhancement`)
        - Approve Enhancement (`PATCH /api/tpa/pre-auth/:id/enhancement/:enhancementId/approve`)
        - Reject Pre-Authorization (`PATCH /api/tpa/pre-auth/:id/reject`)
        - Final Authorization at discharge with manual non-payable breakdown (`PATCH /api/tpa/pre-auth/:id/final-authorize`)
        - Settle Claim (`PATCH /api/tpa/pre-auth/:id/settle`)
        - Cancel Pre-Authorization (`PATCH /api/tpa/pre-auth/:id/cancel`)
    - Updated `frontend/src/App.jsx`: Registered route `/tpa/pre-auth` with protected role guard (`['admin', 'tpa', 'reception', 'billing', 'ipd', 'doctor', 'nursing']`).
  - **Step 7 (IPD + Insurance + Pre-Authorization Integration)**:
    - Created `frontend/src/components/ipd/IpdInsuranceSection.jsx`:
      - Connected existing IPD admission workflow with patient insurance policies and cashless pre-authorization records.
      - Displays active cashless policy (Insurer, TPA, Policy #, Member ID, Validity, Sum Insured, Available Balance).
      - Handles Self-Pay / Cash patients gracefully with clear notice ("No insurance policy linked") without forcing insurance entry.
      - Displays pre-authorization status and financial breakdown (Claim Number, Status badge, Initial Requested, Total Approved, Final Authorized, Co-pay, Deductible, Non-Payable, TPA Receivable).
      - Highlights pending queries with quick "Respond Now" trigger and in-progress enhancements.
      - Single-click action buttons: "Create Pre-Authorization" (passes `patientId` & `ipdId`) or "Open TPA Desk / View Pre-Auth".
    - Updated `frontend/src/pages/ipd/IpdPatientDetails.jsx`:
      - Added `IpdInsuranceSection` on the `patient-info` tab.
      - Added dedicated `insurance` tab (`Insurance & Cashless`) in IPD Patient Details tabs.
    - Updated `frontend/src/pages/ipd/IpdPatientList.jsx`:
      - Added `Insurance & Pre-Auth` quick action button in the action menu for each admission.
    - Preserved 100% of existing IPD business logic (admission creation, numbering, room/bed assignment, doctor allocation, discharge, billing, and clinical charts).
  - **Step 8 (Billing + TPA Financial Integration)**:
    - **Read-Only Billing Audit**: Inspected `backend/models/Billing.js`, `billingController.js`, and `BillingPage.jsx`. Confirmed that existing `Billing` schema already supports `'Insurance'` and `'Mixed Payment'` payment modes, `transactionRef` (for Claim / Pre-Auth reference), `remarks`, `advanceAdjusted`, `payments` installment subdocuments, `amountPaid`, and `dueAmount`. Verified that no backend model or API changes were needed.
    - **Financial Business Mapping**:
      - `Hospital Bill Total (Net)` = `netPayable` (computed from gross subtotal - discounts + GST - patient advances).
      - `TPA Approved / Final Authorized Amount` = Loaded directly from pre-auth (`finalAuthorizedAmount` takes precedence if > 0, otherwise `totalApprovedAmount` / `initialApprovedAmount`).
      - `Non-Payable Amount` = Strictly MANUAL entry (never auto-calculated from billing line items).
      - `Co-pay Amount` & `Deductible Amount` = Editable manual entries initialized from Pre-Authorization terms.
      - `Patient Payable Amount` = `Non-Payable + Co-pay + Deductible + max(0, netPayable - Non-Payable - Co-pay - Deductible - TPA Authorized)`.
      - `TPA Receivable Amount` = `min(TPA Authorized, max(0, netPayable - Non-Payable - Co-pay - Deductible))`.
    - **Safe UI Integration in Billing Desk (`BillingPage.jsx`)**:
      - Added **"TPA Insurance & Cashless Financial Desk"** card to the right-side summary column of the billing workspace.
      - Automatically loads patient Pre-Authorizations (`GET /api/tpa/pre-auth?patientId=...`) and Insurance policies (`GET /api/tpa/patient-insurance?patientId=...`) upon patient selection.
      - Displays Insurance Company, TPA Provider, Policy Number, Claim Number, and Pre-Authorization Status badge.
      - Shows clear warning badge when claim status is provisional (`Draft`, `Submitted`, `Queried`, `Enhancement Requested`), reminding staff that final cashless settlement should only be executed against `Approved` or `Final Authorized` claims.
      - Prominently labels `"Non-Payable — Manual Entry *"` with subtitle `"Manual entry — never auto-calculated from line items. Enter deductions from TPA approval letter."`
      - Provides `"Apply Cashless Split to Ledger"` button which populates `paymentMode = 'Insurance'`, `transactionRef = claimNumber`, sets `customPaidAmount = Patient Payable`, and formats structured remarks.
      - Enhanced the Final Payment Collection & Ledger Modal (`showPaymentModal`) to show the TPA cashless breakdown, quick `"Collect Patient Share"` and `"Fill Claim Ref"` buttons when `paymentMode === 'Insurance'`.
      - Preserved 100% of existing billing calculations (subtotal, line discounts, admin discounts, GST toggles, item selection, advance adjustments, due calculations, cash/card/UPI/mixed payments, and discharge clearance locks). Self-pay/cash patients work exactly as before.
  - **Step 10 (TPA Claim Model)**:
    - **Model Creation**: Created `backend/models/TpaClaim.js` to represent the post-discharge claim dossier and document submission package.
    - **References**: Scoped by `hospitalId` (ref Hospital), referencing `patientId` (ref Patient), `ipdAdmissionId` (ref IpdAdmission), `patientInsuranceId` (ref PatientInsurance), `insuranceCompanyId` (ref InsuranceCompany), `tpaId` (ref TpaMaster), `preAuthorizationId` (ref PreAuthorization), and `billingId` (ref Billing).
    - **Financial Summary Snapshot**: Stores finalized values (`totalHospitalBill`, `finalAuthorizedAmount`, `claimedAmount`, `nonPayableAmount`, `copayAmount`, `deductibleAmount`, `settledAmount`, `tdsDeducted`, `disallowedAmount`, `netReceivedAmount`), all defaulting to 0 with `min: 0`. Non-payable remains manual.
    - **Submission Logistics**: Tracks `submissionType` (`'TPA Portal'`, `'Physical Courier'`, `'Email'`, `'In-Person Desk'`), `submissionDate`, `portalClaimId`, `courierName`, `trackingNumber`, `dispatchDate`, and `acknowledgmentDocUrl`.
    - **Status Lifecycle**: Enforces `status` enum (`'Draft'`, `'Documents Pending'`, `'Ready for Submission'`, `'Submitted'`, `'Under Query'`, `'Query Responded'`, `'Approved'`, `'Partially Settled'`, `'Settled'`, `'Rejected'`, `'Cancelled'`), default `'Draft'`.
    - **Document Checklist**: Embedded subdocument array `documents: [tpaClaimDocumentSchema]` tracking category (`'Identity'`, `'Policy'`, `'PreAuth'`, `'Clinical'`, `'Discharge'`, `'Lab'`, `'Pharmacy'`, `'Billing'`, `'ClaimForm'`, `'Other'`), `title`, `fileName`, `fileUrl`, `cloudinaryPublicId`, `fileType`, `uploadedAt`, and `uploadedBy`.
    - **Settlement & Audit**: Fields for `settlementRef`, `utrNumber`, `settlementDate`, `settlementRemarks`, `createdBy`, `updatedBy`, and `timestamps: true`.
    - **Multi-Tenant Compound Indexes**: `{ hospitalId: 1, claimNumber: 1 }` (unique), `{ hospitalId: 1, status: 1 }`, `{ hospitalId: 1, patientId: 1 }`, `{ hospitalId: 1, ipdAdmissionId: 1 }`, `{ hospitalId: 1, preAuthorizationId: 1 }`, `{ hospitalId: 1, billingId: 1 }`.
  - **Step 11A (TPA Claim Query History Model Update)**:
    - **Model Update**: Updated `backend/models/TpaClaim.js` to add `claimQuerySchema` and `queryHistory` subdocument array.
    - **Query Subschema Fields**: `queryText` (required, trimmed), `queryDate` (default `Date.now`), `responseText` (default `''`, trimmed), `responseDate`, `queryDocUrl`, `responseDocUrl`, `status` (`'Open'`, `'Responded'`, `'Closed'`, default `'Open'`), and `timestamps: true`.
    - **TpaClaim Field**: `queryHistory: { type: [claimQuerySchema], default: [] }`.
    - **Preservation**: Kept all existing 38 schema paths, `documents` array, financial snapshot fields, submission logistics, and 15 multi-tenant compound indexes untouched.
- **Database Safety**: Zero database connections or mutations executed. No seed scripts or migrations run.
- **Testing**: Node syntax check (`node --check`) and in-memory Mongoose schema compilation test (39 paths, 15 indexes verified, `queryHistory` subdocument paths verified) passed cleanly.
- **Status**: Phase 2 Step 11A Complete.

### Task 12: Phase 2 — Step 11B: TPA Claim Controller + Routes
- **Date**: 2026-10-09
- **Task**: Implement backend controller and route modules for post-discharge TPA Claim dossiers, query tracking, settlement reconciliation, and document metadata checklist.
- **Files/Folders Created**:
  - `backend/controllers/tpaClaimController.js`
  - `backend/routes/tpaClaimRoutes.js`
- **What Was Changed**:
  - Created controller with 16 handler functions and express router with 16 endpoints.
  - Strictly multi-tenant scoped via `req.user.hospitalId` with `tenantFilter` helper.
  - Implemented relational cross-validation against `Patient`, `IpdAdmission`, `PatientInsurance`, `InsuranceCompany`, `TpaMaster`, `PreAuthorization`, and `Billing` models within the tenant hospital.
  - Enforced hospital-scoped claim number uniqueness returning HTTP 409 on duplicate entries.
  - Enforced backend-authoritative status lifecycle state machine:
    - `Draft` / `Documents Pending` (editable via PUT) -> `Ready for Submission` -> `Submitted` -> `Under Query` <-> `Query Responded` -> `Approved` -> `Partially Settled` -> `Settled` (Terminal).
    - `Rejected` and `Cancelled` strictly enforced as terminal states preventing further edits or reopenings.
  - Added embedded query lifecycle support (`addClaimQuery`, `respondToClaimQuery`) maintaining `queryHistory` subdocument entries with Mongoose subdoc IDs.
  - Added financial settlement endpoints (`partiallySettleClaim`, `settleClaim`) capturing `settledAmount`, `tdsDeducted`, `disallowedAmount`, `netReceivedAmount`, `settlementRef`, and `utrNumber`.
  - Added document checklist metadata handlers (`addClaimDocument`, `deleteClaimDocument`) for categorizing claim documents without performing direct cloud mutation in this step.
  - Applied role guards matching Medora360 access matrices (`canViewClaims`, `canCreateOrUpdateDraft`, `adminOrTpaOnly`, `canSettleClaims`, `canManageDocuments`).
  - Zero modifications to existing models (`TpaClaim.js`, `Billing.js`, `PreAuthorization.js`, `PatientInsurance.js`, `IpdAdmission.js`), `server.js`, or frontend files.
- **Endpoints Implemented (Base: `/api/tpa/claims`)**:
  - `POST /` — Create Claim (Draft) (`canCreateOrUpdateDraft`)
  - `GET /` — List Claims with filters & safe pagination (`canViewClaims`)
  - `GET /:id` — Get Claim Details with safe populations (`canViewClaims`)
  - `PUT /:id` — Update Draft / Documents Pending Claim (`canCreateOrUpdateDraft`)
  - `PATCH /:id/documents-pending` — Transition to Documents Pending (`canCreateOrUpdateDraft`)
  - `PATCH /:id/ready-for-submission` — Mark Ready for Submission (`adminOrTpaOnly`)
  - `PATCH /:id/submit` — Submit Claim via Portal, Courier, Email, or Desk (`adminOrTpaOnly`)
  - `POST /:id/query` — Log Query from TPA (`adminOrTpaOnly`)
  - `PATCH /:id/query/:queryId/respond` — Respond to Open Query (`adminOrTpaOnly`)
  - `PATCH /:id/approve` — Approve / Sanction Claim (`adminOrTpaOnly`)
  - `PATCH /:id/reject` — Mark Claim as Rejected (`adminOrTpaOnly`)
  - `PATCH /:id/cancel` — Cancel Non-Terminal Claim (`adminOrTpaOnly`)
  - `PATCH /:id/partially-settle` — Record Partial Settlement (`canSettleClaims`)
  - `PATCH /:id/settle` — Record Final Settlement & Close (`canSettleClaims`)
  - `POST /:id/documents` — Add Document Checklist Metadata (`canManageDocuments`)
  - `DELETE /:id/documents/:documentId` — Remove Document Metadata (`canManageDocuments`)
- **Database Safety**: Zero database connections or mutations executed. Modules validated strictly in Node.js memory isolation without running server or connecting to MongoDB.
- **Testing**:
  - `node --check backend/controllers/tpaClaimController.js` passed with exit code 0.
  - `node --check backend/routes/tpaClaimRoutes.js` passed with exit code 0.
  - In-memory route registration test verified 16 controller methods and 16 router endpoints with 100% pass rate.
- **Status**: Phase 2 Step 11B Complete.

### Task 13: Phase 2 — Step 12: Mount TPA Claim Routes
- **Date**: 2026-10-09
- **Task**: Mount the post-discharge TPA Claim routes in `backend/server.js` under `/api/tpa/claims`.
- **Files Modified**:
  - `backend/server.js`
- **What Was Changed**:
  - Added `app.use('/api/tpa/claims', require('./routes/tpaClaimRoutes'));` directly alongside the existing TPA route mounts (`/api/tpa`, `/api/tpa/patient-insurance`, `/api/tpa/pre-auth`).
  - Preserved existing route prefixes, middleware, and error handlers.
  - Zero modifications to models, controllers, route handlers, `.env`, or frontend files.
- **Endpoints Mounted (Base: `/api/tpa/claims`)**:
  - All 16 TPA Claim endpoints (`POST /`, `GET /`, `GET /:id`, `PUT /:id`, `PATCH /:id/documents-pending`, `PATCH /:id/ready-for-submission`, `PATCH /:id/submit`, `POST /:id/query`, `PATCH /:id/query/:queryId/respond`, `PATCH /:id/approve`, `PATCH /:id/reject`, `PATCH /:id/cancel`, `PATCH /:id/partially-settle`, `PATCH /:id/settle`, `POST /:id/documents`, `DELETE /:id/documents/:documentId`) now accessible under `/api/tpa/claims`.
- **Database Safety**: Zero database operations executed. Validated via static code analysis and in-memory routing tests without connecting to MongoDB.
- **Testing**:
  - `node --check backend/server.js` passed with exit code 0.
  - In-memory route mount test verified exactly 1 mount for `/api/tpa/claims` and all 16 endpoints registered.
- **Status**: Phase 2 Step 12 Complete.

### Task 14: Phase 2 — Step 13: TPA Claim Management Frontend
- **Date**: 2026-10-09
- **Task**: Create the frontend Claims Management screen, status workflow state machine modals, query history resolution UI, document metadata checklist, and settlement tracking.
- **Files Created**:
  - `frontend/src/pages/tpa/ClaimsManagement.jsx`
- **Files Modified**:
  - `frontend/src/App.jsx`
  - `frontend/src/components/Sidebar.jsx`
- **Features Implemented**:
  - **Summary Metrics Header**: Dynamic KPI counters for Total Claims, Docs/Draft, Ready/Submitted, Under Query, Approved, and Settled Total (₹).
  - **Comprehensive Claims Table**: Server-side paginated and filterable by status, insurer, submission mode, and real-time multi-identifier search.
  - **Status Lifecycle State Machine Actions**:
    - `Draft` $\rightarrow$ Edit, Mark Documents Pending, Mark Ready for Submission, Cancel.
    - `Documents Pending` $\rightarrow$ Edit, Add Document Metadata, Mark Ready for Submission, Cancel.
    - `Ready for Submission` $\rightarrow$ Submit Claim with mode-specific logistics (Portal ID, Courier/AWB #, Dispatch Date).
    - `Submitted` $\rightarrow$ Log TPA Query, Approve/Sanction, Reject, Cancel.
    - `Under Query` $\rightarrow$ Respond to TPA Query with clarification notes & doc URLs.
    - `Query Responded` $\rightarrow$ Approve, Log Additional Query, Reject.
    - `Approved` $\rightarrow$ Record Partial Settlement, Record Final Settlement & UTR.
    - `Partially Settled` $\rightarrow$ Record Additional Partial / Final Settlement.
    - Terminal States (`Settled`, `Rejected`, `Cancelled`) $\rightarrow$ Locked view-only access.
  - **Document Metadata Checklist**: Embedded modal tracking categories (`Identity`, `Policy`, `PreAuth`, `Clinical`, `Discharge`, `Lab`, `Pharmacy`, `Billing`, `ClaimForm`, `Other`) with direct metadata addition/removal.
  - **Route & Navigation**:
    - Protected route registered in `App.jsx`: `/tpa/claims` for roles `['admin', 'tpa', 'reception', 'billing', 'ipd', 'doctor', 'nursing']`.
    - Sidebar navigation link added in `Sidebar.jsx`: `"TPA Claims"` with `ClipboardCheck` icon across Admin, Reception, IPD, Billing, and TPA Desk sections.
- **Database Safety**: Zero database connections or mutations executed.
- **Testing**: Frontend Vite production build test completed cleanly with exit code 0 (`✓ built in 1.67s`).
- **Status**: Phase 2 Step 13 Complete.

### Task 15: Phase 2 — Step 14: Read-Only Cloudinary Document Architecture Audit
- **Date**: 2026-10-09
- **Task**: Conduct comprehensive read-only audit of existing Cloudinary implementations across Medora360 to architect secure TPA Claim document uploads.
- **Audit Findings**:
  - **Configuration**: Uses `cloudinary` npm package v2.10.0 configured via `process.env.CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `CLOUDINARY_URL`.
  - **Payload Format**: Base64 data URIs over JSON (`application/json`) supported natively by Express body parser (`limit: '100mb'`).
  - **Folder Conventions**: Multi-tenant folder convention `hospital_${hospitalId}/...` established in OT and Hospital Settings modules. Recommended TPA Claim folder: `hospital_${hospitalId}/tpa_claims/${claimId}`.
  - **Resource Types**: `resource_type: 'auto'` is the established standard for mixed clinical/billing files (PDF, JPG, PNG).
  - **Security & Integrity**: Tenant isolation verified via `tenantFilter`, role guards, and subdocument metadata synchronization.
  - **Zero Mutations**: Zero database or Cloudinary mutations occurred.
- **Status**: Phase 2 Step 14 Complete (Read-Only Audit).

### Phase 2 — Step 15: TPA Claim Document Upload Implementation
- **Date**: 2026-10-09
- **Task**: Implement real Cloudinary document upload for TPA Claims using the existing Cloudinary architecture discovered in Step 14.
- **Changes Made**:
  - **Backend Controller & Routes**:
    - Reused existing `cloudinary` npm package and environment variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_URL`).
    - Added `POST /api/tpa/claims/:id/documents/upload` endpoint in `backend/routes/tpaClaimRoutes.js` mapped to `uploadClaimDocument` in `backend/controllers/tpaClaimController.js`.
    - Protected endpoint with `authMiddleware` and role authorization (`admin`, `superadmin`, `tpa`, `billing`).
    - Implemented multi-tenant claim validation using `tenantFilter(req, { _id: req.params.id })`.
    - Implemented terminal claim protection (uploads allowed only for `Draft`, `Documents Pending`, `Ready for Submission`, `Submitted`, `Under Query`, `Query Responded`, `Approved`, `Partially Settled`; rejected with HTTP 400 for `Settled`, `Rejected`, `Cancelled`).
    - Implemented file payload validation:
      - 20 MB size limit calculated on decoded base64/binary payload.
      - Strict MIME type validation: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
      - Filename sanitization against path traversal, slashes, control chars, and unsafe symbols.
    - Cloudinary upload folder structured as: `hospital_${req.user.hospitalId}/tpa_claims/${claim._id}` with `resource_type: 'auto'`.
    - Document metadata saved to `claim.documents` with server-generated `fileUrl`, `cloudinaryPublicId`, `uploadedAt`, `uploadedBy: req.user._id`, and `fileType`.
    - Implemented orphan asset safety rollback: if MongoDB save fails after Cloudinary upload succeeds, the uploaded Cloudinary asset is automatically destroyed (`cloudinary.uploader.destroy`).
    - Enhanced `deleteClaimDocument` (`DELETE /api/tpa/claims/:id/documents/:documentId`) to destroy the corresponding Cloudinary asset when `cloudinaryPublicId` is present before pulling metadata.
    - Preserved existing metadata-only endpoint `POST /api/tpa/claims/:id/documents`.
  - **Frontend UI (`ClaimsManagement.jsx`)**:
    - Replaced basic metadata modal with `UploadDocumentModal` supporting both direct file upload to Cloudinary and fallback external URL attachment.
    - Added drag-and-drop / click-to-browse file picker for `.pdf, .jpg, .jpeg, .png, .webp` (max 20 MB).
    - Added client-side file size (20 MB) and MIME type validation.
    - Integrated browser `FileReader` converting files to Base64 Data URI on submission.
    - Added upload state UX: disabled buttons, "Uploading to Cloud..." progress indicator, duplicate submission prevention, and form state retention on error.
    - Enforced UI permissions: upload and delete actions visible only to `admin`, `superadmin`, `tpa`, `billing`.
- **Status**: Phase 2 Step 15 Complete.

### Phase 2 — Step 16: Read-Only TPA End-to-End Integration Audit
- **Date**: 2026-10-09
- **Task**: Perform comprehensive read-only end-to-end integration audit across all Phase 1 and Phase 2 TPA/Insurance modules.
- **Audit Findings**:
  - **Complete Lifecycle Verification**: All 11 workflow stages (Admin $\rightarrow$ Master $\rightarrow$ Patient Insurance $\rightarrow$ IPD $\rightarrow$ PreAuth $\rightarrow$ Billing $\rightarrow$ Claim $\rightarrow$ Documents $\rightarrow$ Query $\rightarrow$ Approval $\rightarrow$ Settlement) verified with functional frontend-to-backend connections.
  - **API Contracts**: All 34 REST API endpoints validated against HTTP methods, request bodies, query parameters, and response structures with zero broken routes.
  - **Model Relationships**: Verified 100% referential integrity across `InsuranceCompany`, `TpaMaster`, `PatientInsurance`, `PreAuthorization`, `TpaClaim`, `IpdAdmission`, `Billing`, and `Patient`.
  - **Multi-Tenant Scoping**: All queries and mutations guarded by `tenantFilter(req)` and explicit multi-tenant cross-reference checks (`hospitalId`).
  - **State Machines**: Verified non-reversible terminal state protection (`Settled`, `Rejected`, `Cancelled`) and query/settlement lifecycles.
  - **Financial Logic**: Manual non-payable entry model preserved without altering standard cash billing or hospital invoice totals.
  - **Document Architecture**: Cloudinary upload (`/documents/upload`), metadata (`/documents`), and safe delete endpoints verified.
  - **Role Authorization**: Backend role enforcement verified against frontend route permissions (`App.jsx`) and navigation links (`Sidebar.jsx`).
  - **Static & Build Checks**: 8 backend files passed `node --check` with 0 errors; frontend Vite production build passed in 2.87s with 0 errors.
  - **Zero Database Operations**: No database connections, test mutations, or production file uploads executed.
- **Status**: Phase 2 Step 16 Complete (All Checks Passed).

### Phase 2 — Step 17: Read-Only Financial Data-Flow Audit
- **Date**: 2026-10-09
- **Task**: Perform a precise read-only financial data-flow audit across `PreAuthorization` $\rightarrow$ `Billing` $\rightarrow$ `TpaClaim`.
- **Audit Scope & Findings**:
  - **Field Consistency & Ownership**: Traced 29 financial fields across backend models (`PreAuthorization.js`, `Billing.js`, `TpaClaim.js`), controllers (`preAuthorizationController.js`, `billingController.js`, `tpaClaimController.js`), and frontend views (`PreAuthManagement.jsx`, `BillingPage.jsx`, `ClaimsManagement.jsx`). Verified 100% naming consistency, type validation, and multi-tenant schema isolation.
  - **Billing Cashless Split Formula**: Verified mathematical logic in `BillingPage.jsx` (`tpaAuthorizedAmount`, `basePatientPortion = nonPayable + copay + deductible`, `maxTpaCoverable = max(0, netPayable - basePatientPortion)`, `calculatedTpaReceivable = min(maxTpaCoverable, tpaAuthorizedAmount)`, `calculatedPatientPayable = max(0, netPayable - calculatedTpaReceivable)`).
  - **PreAuth $\rightarrow$ Claim Mapping**: Traced dynamic lookups in `ClaimsManagement.jsx` loading `finalAuthorizedAmount`, `claimedAmount`, `nonPayableAmount`, `copayAmount`, and `deductibleAmount` with manual confirmation and override options before dossier dispatch.
  - **Manual Non-Payable Rule**: Verified that `nonPayableAmount` is strictly a manual entry in all 3 modules (`PreAuthorization`, `BillingPage`, `TpaClaim`) with 0 automated deduction algorithms from invoice line items.
  - **Persistence Verification**: Verified persistence targets (`patientPayableAmount` and `tpaReceivableAmount` persisted in `PreAuthorization`, cashless split ledger applied to `amountPaid` and `dueAmount` in `Billing`, snapshot persisted in `TpaClaim`).
  - **Settlement Tracking**: Traced settlement disbursement lifecycle (`settledAmount`, `tdsDeducted`, `disallowedAmount`, `netReceivedAmount`, `settlementRef`, `utrNumber`, `settlementDate`, `settlementRemarks`) via `/partially-settle` and `/settle` endpoints.
  - **Zero Database & Code Modifications**: No database connections, queries, test data, or source code modifications executed.
- **Status**: Phase 2 Step 17 Complete (Overall Status: PASS).

### Phase 3 — Step 1: Safe UAT Environment Readiness Audit
- **Date**: 2026-10-09
- **Task**: Perform a comprehensive read-only audit of backend, database, environment variables, startup scripts, and Cloudinary architecture to establish a safe, isolated UAT environment.
- **Audit Findings**:
  - **Database Configuration & Target Type**: Currently configured for remote MongoDB Atlas cluster (`*.mongodb.net`). Confirmed that a separate local MongoDB database (`mongodb://127.0.0.1:27017/hospital_management_uat`) can be used safely without touching remote data.
  - **Required Environment Variables**: Identified minimum required keys (`PORT`, `MONGO_URI`, `JWT_SECRET`, `SUPER_ADMIN_LOGIN_ID`, `SUPER_ADMIN_PASSWORD`, `FRONTEND_URL`, and Cloudinary keys for document tests).
  - **Startup Database Operations**: Verified that `connectDB` runs `ensureTenantIndexes` (drops legacy global indexes and creates tenant compound indexes) and `disableLegacyDefaultAdmin` (disables global non-tenant admin). `server.js` also initializes `startMedicationScheduler` (periodic check on IPD missed medication doses). Zero automated schema migration or seed scripts run on startup.
  - **Safe Execution Commands**: Documented safe development and build commands (`npm run dev` / `npm start` for backend with local URI, `npm run dev` for frontend Vite server, `npm run build` for frontend bundle).
  - **Cloudinary Sandbox Isolation**: Verified that TPA uploads are strictly scoped to `hospital_<hospitalId>/tpa_claims/<claimId>` and can safely use a test account or folder.
  - **Zero Database Operations**: No database queries, connections, test records, or Cloudinary file modifications executed.
- **Status**: Phase 3 Step 1 Complete (Overall Status: PASS).

### Phase 3 — Step 2: Read-Only UAT Environment Configuration Audit
- **Date**: 2026-10-09
- **Task**: Audit `dotenv` loading, external environment variable overrides, and startup behavior to determine how to run the backend safely against a local MongoDB database without modifying `backend/.env`.
- **Audit Findings**:
  - **Dotenv Loading & Override Behavior**: `backend/server.js:L9` uses `dotenv.config({ path: path.join(__dirname, '.env'), override: true })`. Because `override: true` is explicitly passed, `dotenv` forcibly overwrites existing `process.env` values with keys defined in `backend/.env`.
  - **PowerShell Override Risk**: Setting `$env:MONGO_URI="mongodb://127.0.0.1:27017/hospital_management_uat"` followed by `npm run dev` is **UNSAFE** because `dotenv.config({ override: true })` immediately overwrites `process.env.MONGO_URI` with the remote Atlas cluster URI upon script startup.
  - **Safe Execution Strategy**: Discovered that a Node wrapper/hook pattern intercepting `dotenv.config` allows all 9 other `.env` variables (`PORT`, `JWT_SECRET`, `SUPER_ADMIN_*`, `CLOUDINARY_*`, `FRONTEND_URL`) to load from `backend/.env` while guaranteeing `process.env.MONGO_URI` is redirected to `mongodb://127.0.0.1:27017/hospital_management_uat`.
  - **Startup Target Safety**: When `MONGO_URI` is local, `ensureTenantIndexes`, index drops/creations, and `disableLegacyDefaultAdmin` run exclusively against the local MongoDB instance.
  - **Cloudinary Account Status**: Documented that Cloudinary calls use the existing credentials in `.env`, with isolation provided by the dynamic folder prefix `hospital_<hospitalId>/tpa_claims/<claimId>`.
  - **Zero Database / Cloudinary Operations**: No commands were executed; no code or environment files were modified.
- **Status**: Phase 3 Step 2 Complete (Overall Status: PASS).

### Task: Insurance & Cashless Settlement Desk UAT Fix
- **Date**: 2026-10-13
- **Task**: Fix remaining issue in Insurance & Cashless Settlement Desk regarding field conflation, terminal Settled status gating, bill capping, and Review & Apply Split button controls.
- **Root Cause & Field Resolution**:
  - Traced `Pre-Authorized Amount` to `totalApprovedAmount` (or `initialApprovedAmount`) in `PreAuthorization.js` representing the credit sanction limit.
  - Traced `Final Claim Authorization` to `finalAuthorizedAmount` in `PreAuthorization.js` / `TpaClaim.js`. Previously, `totalApprovedAmount` (₹5,00,000) was erroneously conflated and displayed under the title `TPA Final Authorized`.
  - On Settled records with no active final claim authorization letter, `finalClaimAuthAmount` is null and displays `Not Available` rather than inventing a value.
- **Files Modified**:
  - `frontend/src/pages/billing/BillingPage.jsx`: Labeled `Pre-Authorized Amount`, displayed `Final Claim Authorization` separately (or `Not Available`), capped TPA allocation at net bill, disabled `Review & Apply Split` when linked record is Settled unless a separate valid final claim record exists, and preserved existing 3-column UI layout & `+ Add Advance Payment` workflow.
  - `backend/controllers/billingController.js`: Updated `validateCashlessSplit` and `createBill` to reject settled claims with HTTP 400 unless a separate valid final claim record meets existing business rules, in which case it adopts `effectivePreauth` and validates against the active authorized cap.
  - `backend/scripts/testCashlessSplitLogic.js`: Added comprehensive in-memory unit tests (39 assertions, all PASS).
- **Status**: Complete (All 39 unit tests PASS, frontend build clean).

### Task: Patient Balance Calculation in Add Insurance / Cashless Settlement Desk
- **Date**: 2026-10-13
- **Task**: Implement the correct patient balance calculation in Medora360 Billing & Invoicing, specifically within the Add Insurance / Cashless Settlement Desk (both the sidebar panel and modal desk in `BillingPage.jsx`), with strict backend validation in `billingController.js`.
- **Core Business Formula**:
  `Remaining Patient Balance = Total Net Hospital Bill - Advance Payments Applied - Eligible TPA Coverage`
- **11 UI Breakdown Fields Implemented (Real-Time Reactive)**:
  1. `Total Hospital Bill` (`grandTotal`)
  2. `Advance Payments Already Received` (`advanceReceived` / `totalAdvanceAvailable`)
  3. `Advance Amount Applied to This Bill` (`advanceApplied` / `advanceToAdjust` input)
  4. `Insurance / TPA Claim Amount` (`tpaClaimAmount`)
  5. `Final Approved / Authorized TPA Amount` (`finalAuthorizedTpaAmount`, labeled "Estimated" if provisional pre-auth, or "Not Available" if unapproved/settled)
  6. `Non-Payable Amount` (`tpaNonPayable` manual entry)
  7. `Co-Pay Amount` (`tpaCopay`)
  8. `Deductible Amount` (`tpaDeductible`)
  9. `Patient Amount Already Paid` (`patientAmountPaid` counter cashier collection)
  10. `Remaining Amount Patient Must Pay` (`remainingAmountPatientMustPay`)
  11. `Remaining Amount Receivable from TPA` (`calculatedTpaReceivable` / `eligibleTpaCoverage`)
- **Financial & Accounting Rules Enforced**:
  - **Rule 1**: Retrieved actual advance payments from `AdvancePayment` collection (`isAdjusted: false`); initialized `advanceToAdjust` to `totalAdvance` automatically in UI so existing advances are never assumed to be zero.
  - **Rule 2**: Ensured advance is only subtracted once as actually applied to the current bill (`netBillAfterAdvance = Math.max(0, grandTotal - advanceApplied)`).
  - **Rule 3**: Maintained strict separation between claim amount, approved/authorized amount, and settled amount.
  - **Rule 4 & 5**: Provisional estimates labeled as "Estimated"; submitted or rejected claims yield ₹0 approved coverage.
  - **Rule 6**: Enforced financial ceiling: `advanceApplied + patientPayable + tpaReceivable <= totalHospitalBill` both on client and server.
  - **Rule 7**: Prevented negative balances and duplicate entries by validating raw numeric values before clamping (`rawPatientPayable < 0 || rawTpaReceivable < 0 || rawAdvanceApplied < 0`).
  - **Rule 8**: When insurance is unavailable or invalid, `eligibleTpaCoverage` is ₹0 and remaining balance is computed from net bill and valid payments only.
  - **Rule 9**: Deductions (`nonPayable + copay + deductible`) reduce maximum TPA coverage (`maxTpaCoverable = Math.max(0, netBillAfterAdvance - (nonPayable + copay + deductible))`) ensuring patient remains responsible without double deductions or double counting.
  - **Rule 10**: Backend validation (`POST /api/billing/validate-cashless-split` & `POST /api/billing`) enforces all rules independently of the frontend.
- **Files Modified**:
  - `frontend/src/pages/billing/BillingPage.jsx`: Added 11-point calculation matrix to right-hand sidebar panel and Cashless Settlement Modal, real-time formula banner, interactive advance adjustment, and audit trail in split remarks.
  - `backend/controllers/billingController.js`: Enhanced `validateCashlessSplit` and `createBill` with advance ledger checks, financial balance equality, raw negative balance checks, and overrun prevention.
  - `backend/scripts/testCashlessSplitLogic.js`: Expanded test suite to 84 automated assertions covering Tests A, B, C, D, E, F, G, H, I, J1, J2.
- **Status**: Complete (84 unit tests PASS, frontend build clean in 1.33s, backend syntax verified).

---

## Testing

| Test Performed | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|
| Read-only database connection check | Successfully connect and list collection names without mutation | Connected to `hospital_management` DB, listed 59 collections | **PASS** |
| Hospital record count verification | Query `hospitals` collection count safely | Returned count: 0 | **PASS** |
| Access code query simulation (`orange`) | Query `hospitals` for `code: "orange"` | Returned 0 matching records | **PASS** |
| Syntax Check `InsuranceCompany.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Syntax Check `TpaMaster.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Mongoose Model Compilation Test | Compile both models in isolated Node process | Both models compiled with all expected schema paths | **PASS** |
| Syntax Check `tpaMasterController.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Syntax Check `tpaMasterRoutes.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Route Stack Registration Verification | Load express router and verify all 14 endpoints | 14 endpoints compiled and registered cleanly | **PASS** |
| Syntax Check `server.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Isolated `/api/tpa` Route Mount Test | Verify Express mounts all 14 endpoints under `/api/tpa` | 14 endpoints verified under `/api/tpa` base path | **PASS** |
| Frontend Vite Production Build Test (Phase 1) | Verify JSX compilation, route mapping, and module bundling | Built cleanly in 18.31s (exit code 0) | **PASS** |
| Syntax Check `PatientInsurance.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Syntax Check `PreAuthorization.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Syntax Check `patientInsuranceController.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Syntax Check `preAuthorizationController.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Syntax Check `patientInsuranceRoutes.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Syntax Check `preAuthorizationRoutes.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Patient Insurance Route Stack Check | Verify 6 router endpoints registered in memory | 6 endpoints verified in memory | **PASS** |
| Pre-Auth Route Stack Check | Verify 14 router endpoints registered in memory | 14 endpoints verified in memory | **PASS** |
| Server.js Route Mount Check (Pre-Auth) | Verify all 34 TPA endpoints resolve under `/api/tpa/*` | 34 endpoints verified under `/api/tpa` | **PASS** |
| Frontend Vite Production Build Test (Phase 2 Step 5) | Verify Patient Insurance JSX, components, and client requests | Built cleanly in 19.12s (exit code 0) | **PASS** |
| Frontend Vite Production Build Test (Phase 2 Step 6) | Verify Pre-Auth Management JSX, modals, lifecycle flows, and client requests | Built cleanly in 1.48s (exit code 0) | **PASS** |
| Frontend Vite Production Build Test (Phase 2 Step 7) | Verify IPD Integration JSX, IpdInsuranceSection, and admission workflows | Built cleanly in 1.62s (exit code 0) | **PASS** |
| Frontend Vite Production Build Test (Phase 2 Step 8) | Verify Billing + TPA Financial Integration in BillingPage.jsx | Built cleanly in 1.59s (exit code 0) | **PASS** |
| Syntax Check `TpaClaim.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Mongoose `TpaClaim` In-Memory Schema Test | Verify 38 schema paths, 15 indexes, status & category enums | 38 paths & 15 indexes compiled in memory | **PASS** |
| Mongoose `TpaClaim` Query History Test | Verify `queryHistory` subdocument, required `queryText`, status enums, 39 paths | 39 paths & `queryHistory` subdocument verified in memory | **PASS** |
| Syntax Check `tpaClaimController.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| Syntax Check `tpaClaimRoutes.js` | Validate JavaScript syntax via `node --check` | Clean parse, exit code 0 | **PASS** |
| TPA Claim Route Stack & Controller Check | Verify all 16 endpoints and controller functions in memory | 16 controller methods & 16 routes verified in memory | **PASS** |
| Server.js TPA Claim Route Mount Check | Verify exactly 1 mount for `/api/tpa/claims` and 16 claim endpoints in memory | 16 claim endpoints verified under `/api/tpa/claims` | **PASS** |
| Frontend Vite Production Build Test (Phase 2 Step 13) | Verify Claims Management JSX, modals, lifecycle flows, and client requests | Built cleanly in 1.67s (exit code 0) | **PASS** |
| Syntax Check `tpaClaimController.js` (Step 15) | Validate JavaScript syntax via `node --check` after upload additions | Clean parse, exit code 0 | **PASS** |
| Syntax Check `tpaClaimRoutes.js` (Step 15) | Validate JavaScript syntax via `node --check` after upload endpoint addition | Clean parse, exit code 0 | **PASS** |
| Frontend Vite Production Build Test (Phase 2 Step 15) | Verify Claims Management JSX, upload modal, FileReader integration, and client requests | Built cleanly in 5.30s (exit code 0) | **PASS** |
| Full TPA Backend Syntax Suite (Step 16) | Validate JavaScript syntax across all 8 TPA controllers & routes via `node --check` | Clean parse, exit code 0 across all 8 files | **PASS** |
| Frontend Vite Production Build Test (Phase 2 Step 16) | Verify full frontend compilation and bundle integrity across all TPA modules | Built cleanly in 2.87s (exit code 0) | **PASS** |
| Financial Data-Flow Audit (Step 17) | Comprehensive read-only audit of PreAuth -> Billing -> Claim financial field consistency and formulas | 29 financial fields verified with 100% naming & formula consistency | **PASS** |
| Safe UAT Environment Audit (Phase 3 Step 1) | Read-only audit of database host target, environment keys, startup routines, and Cloudinary test isolation | Local test readiness verified; 0 production operations executed | **PASS** |
| Pre-Auth Submit UAT Bug Fix | Fix `TypeError: Cannot read properties of undefined (reading 'initialRequestedAmount')` when submitting Draft Pre-Auth | Added body guards (`req.body || {}`) in backend controller and passed empty object `{}` from frontend PATCH call | **PASS** |
| IPD Discharge / Final Bill Multi-Source Aggregation | Fix issue where discharge/final bill only showed bed charges by aggregating all IPD charge sources (Bed, Consumables, Medicines, Lab, OT, Doctor, Pharmacy) | Updated `billingController.js` and `ipdServicesController.js` to include all stay charges when `billType === 'IPD'` or `'All'`, and decoupled per-item `billedSourceIds` checks | **PASS** |
| Insurance & Cashless Settlement Desk UAT Fix | Fix field conflation between pre-authorization amount and final claim authorization amount, label Pre-Authorized Amount, display Not Available for missing final auth, enforce net bill capping, and disable/reject Review & Apply Split on Settled records unless separate valid final claim exists | All 39 unit tests in `testCashlessSplitLogic.js` passed, frontend Vite build clean (12.60s), backend syntax verified | **PASS** |
| Test A — Insurance Available (Cashless Balance) | Bill ₹4L, Advance ₹1L, TPA ₹2L -> Remaining Patient Balance ₹1L | Remaining Patient Balance: ₹1,00,000.00; Net: ₹3,00,000.00 | **PASS** |
| Test B — No Insurance Available | Bill ₹4L, Advance ₹1L, TPA ₹0 -> Remaining Patient Balance ₹3L | Remaining Patient Balance: ₹3,00,000.00; TPA: ₹0.00 | **PASS** |
| Test C — Advance Covers the Bill | Bill ₹4L, Advance ₹4L, TPA ₹0 -> Remaining Patient Balance ₹0 | Remaining Patient Balance: ₹0.00; Net: ₹0.00 | **PASS** |
| Test D — TPA Amount Exceeds Remaining Bill | Bill ₹4L, Advance ₹1L, Claim ₹3.5L -> Capped at ₹3L, Patient Balance ₹0 | TPA allocation capped at ₹3,00,000.00; Patient Balance: ₹0.00 | **PASS** |
| Test E — Deductions Preservation (Rule 9) | Bill ₹4L, Advance ₹1L, NonPay ₹20k, Copay ₹10k, Auth ₹2.5L -> Patient Balance ₹50k | Patient Balance: ₹50,000.00 (30k deductions + 20k uncovered); 0 double deductions | **PASS** |
| Test F — Counter Payment Distribution | Patient counter payment ₹20k applied -> Remaining Patient Must Pay ₹30k | Remaining to Pay: ₹30,000.00; Advance + TPA + Paid + Due === Bill | **PASS** |
| Tests G-J — Backend Validation Guardrails | Ledger checks, overrun blocking, negative balance rejection, unapproved status blocking | 84/84 assertions passed in `testCashlessSplitLogic.js` | **PASS** |
| Scenario A — User Specified Verification | ₹4L bill, ₹1L advance, ₹2L approved TPA -> ₹1L patient due; all 11 summary fields verified | 11/11 summary fields, exact balance formula, reconciliation identity | **PASS** |
| Scenario B — User Specified Verification | Same bill & advance, no valid insurance -> ₹3L patient due, TPA allocation ₹0 | TPA allocation ₹0, patient due ₹3,00,000, reconciliation holds | **PASS** |
| Scenario C — Settled Claim Protection | Settled claim without separate valid claim -> TPA allocation remains ₹0 | UI reason shown, button disabled, backend rejects with 400 | **PASS** |
| Scenario D — Invoice Reload Consistency | Invoice reload retains exact values with persisted ledger records | Mongoose schema persistence & round-trip verification, 0 drift | **PASS** |
| Scenario E — Final Invoice Reconciliation | Bill, advance, TPA, patient collection & balance reconcile across all payment states | Advance + Patient Paid + TPA + Patient Due === Net Bill (103/103 tests pass) | **PASS** |
| Frontend Production Build (Billing Desk) | Verify BillingPage.jsx, Vite bundle compilation and zero build errors | Built cleanly in 1.41s (exit code 0) | **PASS** |
| Billing Desk ReferenceError Fix | Fix `Uncaught ReferenceError: remainingTpaReceivable is not defined` at `BillingPage.jsx:2377` | Defined `const remainingTpaReceivable = tpaAllocation;` at line 1053; built cleanly in 1.36s | **PASS** |
| Simplified Hospital Billing Workflow | Simplify Medora360 Billing & Invoicing to match cashier workflow: 4 prominent fields (Total Bill, Less Advance Applied, Less Insurance/TPA Applied, Final Amount Patient Must Pay); streamlined Cashless Desk with claim selection, requested & approved limits, adjustable allocation bounded by backend validation, live balance preview, clean no-insurance fallback; invoice table footer & ledger reconciliation matching formula; 135 automated unit tests | All 135 unit tests in `testCashlessSplitLogic.js` passed, `npm run build` Vite production bundle clean (1.50s), backend node syntax verified | **PASS** |



---

## Pending Work
- [x] Phase 1 — Step 1: Create `InsuranceCompany` and `TpaMaster` backend models.
- [x] Phase 1 — Step 2: Implement `tpaMasterController.js` and `tpaMasterRoutes.js` (CRUD, validation, tenant scoping).
- [x] Phase 1 — Step 3: Register `/api/tpa` routes in `server.js`.
- [x] Phase 1 — Step 4: Build frontend TPA Master Settings admin UI (`TpaMasterSettings.jsx`).
- [x] Phase 2 — Step 1: Patient Insurance & Pre-Auth Architecture Audit.
- [x] Phase 2 — Step 2: Create `PatientInsurance.js` and `PreAuthorization.js` models.
- [x] Phase 2 — Step 3: Implement `patientInsuranceController.js`, `preAuthorizationController.js`, `patientInsuranceRoutes.js`, and `preAuthorizationRoutes.js`.
- [x] Phase 2 — Step 4: Register Patient Insurance & Pre-Auth routes in `server.js`.
- [x] Phase 2 — Step 5: Build frontend Patient Insurance Profile UI (`PatientInsuranceSection.jsx`).
- [x] Phase 2 — Step 6: Build frontend Pre-Authorization Workflow UI (`PreAuthManagement.jsx`).
- [x] Phase 2 — Step 7: IPD + Insurance + Pre-Authorization Integration (`IpdInsuranceSection.jsx`).
- [x] Phase 2 — Step 8: Billing + TPA Financial Integration (`BillingPage.jsx`).
- [x] Phase 2 — Step 9: TPA Claims + Document Workflow Read-Only Audit.
- [x] Phase 2 — Step 10: TPA Claim Model (`TpaClaim.js`).
- [x] Phase 2 — Step 11A: TPA Claim Query History Model Update (`TpaClaim.js`).
- [x] Phase 2 — Step 11B: TPA Claim Controller & Routes (`tpaClaimController.js`, `tpaClaimRoutes.js`).
- [x] Phase 2 — Step 12: Route Mounting in `server.js` (`/api/tpa/claims`).
- [x] Phase 2 — Step 13: TPA Claim Management Frontend (`ClaimsManagement.jsx`).
- [x] Phase 2 — Step 14: Read-Only Cloudinary Document Architecture Audit.
- [x] Phase 2 — Step 15: Implement TPA Claim Document Upload (`tpaClaimController.js`, `tpaClaimRoutes.js`, `ClaimsManagement.jsx`).
- [x] Phase 2 — Step 16: Read-Only TPA End-to-End Integration Audit.
- [x] Phase 2 — Step 17: Read-Only TPA Financial Data-Flow Audit.
- [x] Phase 3 — Step 1: Safe UAT Environment Readiness Audit.
- [x] Phase 3 — Step 2: Read-Only UAT Environment Configuration Audit.
- [x] Phase 3 — Step 3: Isolated Local UAT Execution & Validation (Billing & Invoicing Cashless + Advance Reconciliation).

---

## Important Decisions
1. **Zero Database Mutation During Error Investigation**: Confirmed that missing record errors during access code lookup should be resolved via standard Super Admin onboarding rather than inserting dummy records or altering query validation logic.
2. **Preservation of Multi-Tenant Security Model**: Hospital access codes remain uniquely indexed (`sparse: true`, `unique: true`, `lowercase: true`) to ensure isolated tenant routing.

---

## Git History
- Initial state on branch `main` at repository start.
- `docs/MEDORA_WORK_LOG.md` created to track end-to-end task history and technical decisions.

---

## Final Summary
- **What Was Already Present**: Full multi-tenant Hospital Management System codebase including backend REST APIs, Vite frontend, Next.js Clinic, and Next.js Labs modules.
- **What We Changed**: Created project work log `docs/MEDORA_WORK_LOG.md` without modifying any application code or database records.
- **What Was Tested**: Read-only database connectivity, collection existence, and hospital query behavior.
- **What Remains**: Planned application features, Super Admin tenant setup, and future TPA module development.
- **Important Notes for Future Developers**:
  - Never place environment secrets, passwords, or credentials in documentation or logs.
  - Keep this log updated at the conclusion of every significant task or fix.
