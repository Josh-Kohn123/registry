# Features Quick Reference

## F08: Couple Dashboard & Gift Management

### Main Dashboard Components
**Location**: `/dashboard` (main page)
- Overview of user's events
- Quick stats on gifts, published events, etc.

**Location**: `/dashboard/events/[eventId]` (event detail dashboard)
- **MetricsCards**: Shows 4 key metrics
  - Total Funds Raised (₪)
  - Total Reservations
  - Total Confirmed Purchases
  - Total Items
- **QuickActions**: Links to manage funds, products, bundles, reservations
- **ShareEventLink**: Copy event URL + Facebook/WhatsApp share buttons
- **ExportButton**: CSV export of all gifts
- **AnalyticsPanel**: Click statistics per item
- **GiftOverviewTable**: Filterable table of all gifts

### CSV Export Format
Columns: Type, Title, Status, Guest Name, Amount/Value, Date
- Includes fund contributions, product reservations, bundle contributions
- File named: `{slug}-gifts-{date}.csv`

### Key Files
- Components: `/src/components/dashboard/*`
- Page: `/src/app/[locale]/dashboard/events/[eventId]/dashboard-page.tsx`
- API: `/src/app/api/events/[eventId]/export`

---

## F10: Analytics & Click Tracking

### How It Works
1. ProductCard, FundCard, and BundleCard track outbound clicks
2. `trackOutboundClick()` sends data to `/api/track`
3. Data aggregated in `/api/events/[eventId]/clicks`
4. AnalyticsPanel displays stats on dashboard

### Privacy Features
- Minimal data collection (timezone, screen size only)
- Device info hashed with SHA256
- Uses sendBeacon API (fires-and-forgets)
- No raw identifiers or PII

### Usage in Components
```tsx
// ProductCard, FundCard, BundleCard accept eventId prop
<ProductCard product={product} eventId={eventId} />
<FundCard fund={fund} eventId={eventId} />
<BundleCard bundle={bundle} eventId={eventId} />
```

### Tracking Library
**File**: `/src/lib/tracking.ts`
```tsx
import { trackOutboundClick, appendUtmParams } from "@/lib/tracking";

// Track a click
await trackOutboundClick(eventId, "product", productId, productUrl);

// Add UTM params (for future affiliate use)
const url = appendUtmParams(originalUrl, eventId, "product", productId);
```

### View Click Stats
- GET `/api/events/[eventId]/clicks` (owner only)
- Returns: totalClicks, clicksByItem (with title and count)

### Key Files
- Library: `/src/lib/tracking.ts`
- Types: `/src/types/analytics.ts`
- API: `/src/app/api/track` (public), `/src/app/api/events/[eventId]/clicks` (owner)
- Component: `/src/components/dashboard/AnalyticsPanel.tsx`

---

## F11: Admin, Abuse & Content Moderation

### Admin Panel
**Location**: `/admin` (protected route)

Tabs:
1. **Search Events**
   - Search by slug or owner email
   - Results show: title, slug, owner, published status, disabled status
   - Can disable events with reason

2. **Manage Reports**
   - List all reports with filtering (Pending/Reviewed/Resolved/Dismissed)
   - Report types: Malicious Link, Spam, Abuse, Other
   - Can resolve with action (disable event, dismiss)

3. **Audit Log**
   - Complete trail of all admin actions
   - Shows action type, reason, timestamp
   - Can filter by event

### Public Reporting (Guest Feature)
**Component**: `ReportButton` (can be placed on public event pages)
- Button/Icon variant available
- Form captures: report type, description, reporter email
- Rate-limited to 5 reports per IP per hour
- Auto-creates report with status=PENDING

### API Endpoints

#### Event Management
- `GET /api/admin/events?q=query` - Search events
- `POST /api/admin/events` - Disable event
- `GET /api/admin/events/[eventId]` - Get event details
- `PUT /api/admin/events/[eventId]` - Toggle disabled status

#### Reports
- `GET /api/admin/reports` - List all reports (admin only)
- `POST /api/admin/reports` - Create report (public, rate-limited)
- `GET /api/admin/reports/[reportId]` - Get report details (admin only)
- `PUT /api/admin/reports/[reportId]` - Resolve report (admin only)

#### Audit Log
- `GET /api/admin/audit` - Get all audit log entries
- `GET /api/admin/audit?eventId=[eventId]` - Get audit for specific event

### Rate Limiting
- `/api/track`: 100 requests per IP per minute
- `/api/admin/reports` (POST): 5 requests per IP per hour
- Implemented in-memory (can swap with Redis)

### Key Files
- Pages: `/src/app/[locale]/admin/page.tsx`
- Components: `/src/components/admin/*`
- API: `/src/app/api/admin/*`
- Library: `/src/lib/rate-limit.ts`
- Types: `/src/types/admin.ts`
- Validators: Check `/src/lib/validators.ts` for schemas

### Middleware Protection
Updated `/src/middleware.ts` to protect:
- `/admin/*` - Requires authentication

---

## Integration Points

### Dashboard Event Page
```tsx
<MetricsCards {...metrics} />
<ShareEventLink eventSlug={slug} eventTitle={title} locale={locale} />
<ExportButton eventId={eventId} eventSlug={slug} />
<AnalyticsPanel eventId={eventId} />
<GiftOverviewTable gifts={gifts} />
```

### Event Listing Pages
```tsx
<ProductCard product={product} eventId={eventId} />
<FundCard fund={fund} eventId={eventId} />
<BundleCard bundle={bundle} eventId={eventId} />
```

### Public Event Pages (add report button)
```tsx
<ReportButton eventId={eventId} variant="button" />
// or
<ReportButton eventId={eventId} variant="icon" />
```

---

## Translation Keys Added

### Dashboard
- dashboardMetrics.totalFundsRaised
- dashboardMetrics.totalReservations
- dashboardMetrics.totalConfirmedPurchases
- dashboardMetrics.totalItems
- dashboardMetrics.exportCSV
- dashboardMetrics.shareEvent

### Admin
- admin.adminPanel
- admin.searchEvents
- admin.manageReports
- admin.auditLog
- admin.disableEvent
- admin.reportButton

### Analytics
- analytics.clickStats
- analytics.totalClicks
- analytics.clicksPerItem
- analytics.noClickData

---

## Testing Checklist

- [ ] Click tracking doesn't block navigation
- [ ] CSV export contains all gift types
- [ ] Admin can search events by slug
- [ ] Admin can disable/enable events
- [ ] Reports can be created by guests
- [ ] Reports appear in admin panel
- [ ] Audit log shows all actions
- [ ] Rate limiting blocks excess requests
- [ ] Analytics panel shows click counts
- [ ] Share links work (Facebook, WhatsApp)
- [ ] Event metrics display correctly

---

## Known Limitations & TODOs

1. **Auth**: Admin checks mock the role (needs Supabase implementation)
2. **Analytics**: Current implementation doesn't persist across server restarts
3. **Rate Limiting**: In-memory only (needs Redis for distributed deployments)
4. **Reports**: No automatic actions (manual admin review required)
5. **Metrics**: Dashboard metrics are hardcoded (need actual calculations)
