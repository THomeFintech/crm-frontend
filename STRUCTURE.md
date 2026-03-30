# CMR Dashboard — Project Structure

```
src/
├── App.jsx                         # Root app: routing, auth gate, layout shell
│
├── pages/
│   ├── LoginPage.jsx               # Login screen with demo account quick-fill
│   ├── SalesOverviewPage.jsx       # Full pipeline stats, charts, team & bank tables
│   ├── PreSalesPage.jsx            # Pre-sales KPIs, funnel, leads table, drawer
│   ├── PostSalesPage.jsx           # Post-sales KPIs, bank funnel, outcomes
│   ├── ContactsPage.jsx            # Contacts list with filters
│   ├── LeadsPage.jsx               # Leads pipeline with stage/type filters
│   └── AdminManagementPage.jsx     # User management (Super Admin only)
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx             # Fixed left nav with role-aware links
│   │   └── Topbar.jsx              # Page title + tab switcher buttons
│   │
│   ├── ui/
│   │   ├── KpiCard.jsx             # Stat card with colored top border
│   │   ├── StateBadge.jsx          # Colored pill for lead state labels
│   │   ├── Toast.jsx               # Bottom-right notification
│   │   ├── Modal.jsx               # Overlay modal wrapper
│   │   └── AccessDenied.jsx        # 🔒 screen for unauthorized tabs
│   │
│   └── charts/
│       └── ChartCanvas.jsx         # Chart.js canvas wrapper (bar/line)
│
├── data/
│   ├── mockData.js                 # All mock API functions (pre, post, sales, etc.)
│   ├── staticData.js               # CONTACTS_DATA, LEADS_DATA, ADMIN_USERS
│   └── constants.js                # DEMO_USERS, stateStyle, roleConfig, STAGE_STYLE
│
├── hooks/
│   └── useToast.js                 # Toast state hook
│
├── utils/
│   └── formatters.js               # fmtAmount(), fmtDate()
│
└── styles/
    └── globals.css                 # CSS variables, reset, scrollbar, animations
```
