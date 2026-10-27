# Hazentra AI — HSE Operations Intelligence MVP

**AI-Powered HSE Operations Intelligence Platform**  
**Powered by PGU Systems**  
**Safer Operations. Smarter Decisions.**

> **Branding notice:** Hazentra AI is a *working name only*. No trademark, domain, or company-name clearance has been completed. Do not treat it as legally cleared.

## What this deliverable actually is

Version **0.1.0** contains a dependency-free, responsive English/Arabic (RTL) web interface; a functional, isolated sample-data demonstration; and a **prepared** Supabase/PostgreSQL multi-tenant backend schema with row-level security (RLS). The live frontend-to-database adapter, email/password authentication, and optional server-side OpenAI reporting endpoint are included in source code but have **not been connected, deployed, or penetration-tested in a live customer environment**.

The demo works immediately without accounts, cloud services, API keys, or installations. It uses **fictional sample data stored in browser localStorage**; resetting it restores the original dataset. Do not use demo mode for real customer information.

### The six approved workstreams

| Workstream | Demonstration | Connected-mode source implementation |
|---|---|---|
| Organizations, sites, users & roles | Sites and member roster; sample role switcher (admin/manager/officer/viewer) | Supabase Auth, bootstrap/admin functions, org_members RLS, site CRUD and role checks |
| Incident and near-miss management | Create, filter, change status, see trends | Tenant-scoped PostgreSQL incidents table and CRUD |
| Housekeeping & safety inspections | Record categories, results, follow-up conditions | Tenant-scoped inspections table and CRUD |
| Risk assessments and CAPA | 5×5 likelihood/impact scoring, action-to-finding traceability, due dates/status | Tenant-scoped risk/action tables, same-site source-link validation and audit events |
| Management dashboards | KPIs, six-month observations, site charts, priority tasks | Aggregated records scoped to signed-in organization |
| Operational reporting | English/Arabic rule-based briefing, copy, print/Save PDF | Optional authenticated serverless AI endpoint using aggregates only, model-side JSON schema, account quota |

**Intentionally excluded from version 1:** regulatory compliance automation, electronic Permit-to-Work, process safety, IoT, CCTV, SCADA and equipment integrations, full inspection templates/media attachments, external invitations, mobile apps, billing, and complex SSO. Add only after the core MVP is validated with industrial pilot users.

## Running the controlled demo

Requirement: Node.js 20+ (no `npm install` needed).

```bash
cd hazentra-ai
npm start
```

Open **http://127.0.0.1:4173**. The app defaults to sample/demo mode. The **EN / العربية** control flips all navigation, forms, tables, dashboards and report output to English or Arabic with RTL page direction. Interact with records, use the **Organization & Sites** page to change sample roles, generate reports, then use **Reset demo** to clear changes.

Development scripts:

```bash
npm test
npm run check
```

## Connecting a real Supabase database

1. **Create a brand-new Supabase project dedicated to Hazentra.** Never reuse the BrightQuest, GRC or dental database; separating customers and products is mandatory.
2. Review `db/001_initial_schema.sql`, then apply it to the dedicated empty PostgreSQL project. It creates orgs, sites, memberships, HSE data tables, tenant-scoped RLS policies, guarded bootstrap/member RPC functions, immutable tenant IDs on update, audit events and a transactional 20-AI-reports-per-user-per-day quota.
3. In `config.js`, set **only** the public `supabaseUrl` and `supabasePublishableKey`. The key is expected to be public; all authorization must be validated by RLS.
4. In Supabase Auth, enable email/password **with verified email**. Configure the production domain for allowed Auth URLs. Sign up the initial administrator, verify their email, log in and complete **Set up organization**; they become the `org_owner`. Create your sites before entering incidents.
5. To add a team member, have them create and verify an account, then use **Add existing user** as an `org_owner` or `admin`. This MVP does not send invitation emails.
6. For AI reporting on Vercel, configure **server-only** environment variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `OPENAI_API_KEY`; `OPENAI_MODEL` is optional. They are consumed by `api/report.js`. **Never put `OPENAI_API_KEY`, private tokens or a Supabase service-role key in `config.js` or any browser file.**
7. Deploy on a separate Vercel project with HTTPS and controlled pilot access. Confirm that `/api/report` returns 401 without a valid bearer token, and 403 for a different company's organization.

The reporting endpoint verifies the signed-in user, checks membership/site access via Supabase RLS, queries the records on the server and sends only aggregate counts to the AI provider. If unavailable, the interface clearly states that a *rule-based report*, not a model-generated report, is shown. AI output requires human review.

## Role matrix

| Role | View own organization records | Create/change HSE records | Add sites | Add existing team members | Generate reports |
|---|---:|---:|---:|---:|---:|
| `org_owner` | Yes | Yes | Yes | Yes | Yes |
| `admin` | Yes | Yes | Yes | Yes | Yes |
| `manager` | Yes | Yes | No | No | Yes |
| `officer` | Yes | Yes | No | No | Yes |
| `viewer` | Yes | No | No | No | Yes |

**Enforcement:** the demonstration simulates roles in the interface; **production authorization depends on database RLS and the guarded RPC functions**, not just hidden buttons. The SQL defines no direct client grants for deleting records, changing memberships or writing audit events.

## Mandatory validation gates **before** using real industrial customer data

- Apply migrations to a dedicated test environment; use **two distinct verified tenants** and prove they cannot list, insert, update or report on each other's organizations, sites, records or members. Test viewer inability to create/update and officer inability to manage users. Verify RPC cannot self-promote or add unverified users.
- Run PostgreSQL/Supabase security advisers and inspect RLS grants/functions. Check no `anon` table access, public service-role credentials, or cross-site foreign keys. Verify quotas under concurrent requests.
- Exercise all data-entry and status flows end-to-end (including stale sessions, refresh tokens, failed submissions, name escaping, empty lists, and SQL constraints). Run browser QA on mobile/tablet/desktop, keyboard navigation, 200% text scaling, color contrast and Arabic RTL *including print reports*. Confirm all site-data formatting is correct.
- Add incident report audit review, backups and restore tests, environment separation, alerting, retention policy, error monitoring, vulnerability scanning, dependency review and an external penetration test before production release.
- For Saudi Arabian users, conduct a **data-protection and hosting/transfer assessment (including PDPL)** prior to processing personal data; HSE incident narratives may include personally identifiable or sensitive information. HSE regulatory-compliance **features** may be later, but applicable privacy/data-security obligations cannot be postponed.
- Perform trademark search and domain screening for the working name **Hazentra AI**, including English and Arabic commercial naming in Pakistan and Saudi Arabia.

## Implementation details

- Frontend: native HTML/CSS/ES modules; responsive two-column shell; navy, white, teal visual identity; no third-party frontend packages.
- State management: persistent local sample dataset; live cloud requests via authenticated Supabase Auth + PostgREST native `fetch`.
- Arabic: complete interface keys in `src/i18n.js`, `dir="rtl"` on the document, mirrored sidebar and layouts, localized date labels and rule-based report output. User-entered content is stored in its authored language and is **not silently machine-translated**.
- Data: UUID tenant IDs, composite foreign keys tying site/organization IDs, immutable tenant ID on updates, per-tenant RLS, audit trail.
- API: `api/report.js` requires a valid bearer JWT and server-side secrets. Model output is validated; deterministic reporting is a clearly marked fallback.
- Security: dynamic HTML escaped, Content Security Policy and basic headers in `vercel.json`, no production secrets in the package. This is a foundation rather than a certification or completed security assurance.

## Project files

```
index.html                 App entry
config.js                  Public runtime configuration only
src/app.js                 Views, forms, routing, interactions, bilingual reporting
src/data.js                Isolated demo / authenticated PostgREST adapter
src/i18n.js                English and Arabic translations
src/styles.css             Responsive enterprise UI and RTL styling
src/utils.js               Risk scoring, stats, escaping, dates
api/report.js              Authenticated, private-key model reporting endpoint
assets/favicon.svg         Product placeholder favicon
db/001_initial_schema.sql  Prepared PostgreSQL schema, roles, RLS and quota
server.mjs                 Development static server
vercel.json                Deployment security headers
tests/                     Automated smoke and calculation tests
```

## Version 0.1.0 verification record

- Source JavaScript syntax check: **passed**.
- Automated Node unit/DOM-stub UI smoke checks: **passed**.
- Local static server HTTP health: **passed**.
- Full graphical-browser QA: **not verified** in this environment (browser navigation blocked by environment policy).
- Real Supabase execution/RLS test: **not run** (no Hazentra database exists yet).
- Cloud deployment/real AI execution: **not run** (not configured).
- Trademark/domain availability: **not checked**.

**Status: coded MVP foundation + working local controlled demo. Not a production-ready SaaS or verified public deployment.**