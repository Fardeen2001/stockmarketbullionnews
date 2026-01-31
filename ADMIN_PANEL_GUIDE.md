# Admin Panel Guide

## Overview

The admin panel provides a secure interface for managing StockMarket Bullion content, viewing statistics, and monitoring system activity.

## Access

**URL:** `/admin/login`

**Default Credentials:**
- Username: `admin` (or set `ADMIN_USERNAME` env var)
- Password: `admin123` (or set `ADMIN_PASSWORD` env var)

⚠️ **IMPORTANT:** Change the default password in production!

## Features

### 1. Dashboard (`/admin`)
- Overview statistics (stocks, metals, news, scraped content)
- Recent news articles
- Recent scraped content
- Quick access to all sections

### 2. News Management (`/admin/news`)
- View all news articles
- Publish/Unpublish articles
- Delete articles
- View article details
- Pagination support

### 3. Stocks Management (`/admin/stocks`)
- View all stocks
- See current prices and changes
- Filter by Sharia compliance
- View stock details

### 4. Metals Management (`/admin/metals`)
- View all metals
- See current prices
- Monitor price changes

### 5. Scraped Content (`/admin/scraped`)
- View all scraped content
- Filter by status (All, Pending, Processed)
- See source information
- Monitor scraping activity

### 6. Trending Topics (`/admin/trends`)
- View AI-detected trending topics
- See trending scores
- Monitor mention counts
- Track source diversity

### 7. Settings (`/admin/settings`)
- View system information
- Monitor cron job schedules
- Security information

## Authentication

### How It Works

1. **JWT-based Authentication**
   - Uses `jose` library for JWT tokens
   - Tokens stored in HTTP-only cookies
   - 24-hour expiration

2. **Protected Routes**
   - All `/admin/*` routes (except `/admin/login`) require authentication
   - Automatic redirect to login if not authenticated
   - Middleware checks on every request

3. **Session Management**
   - Login: `/api/admin/login` (POST)
   - Logout: `/api/admin/logout` (POST)
   - Verify: `/api/admin/verify` (GET)

## Configuration

### Environment Variables

Add to `.env.local`:

```env
# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_strong_password_here
ADMIN_SECRET_KEY=your_random_secret_key_min_32_chars
```

### Security Best Practices

1. **Change Default Password**
   - Never use default `admin123` in production
   - Use strong, unique password
   - Store in environment variables

2. **Secret Key**
   - Generate a random 32+ character string
   - Keep it secret
   - Use different keys for different environments

3. **HTTPS**
   - Always use HTTPS in production
   - Cookies are set with `secure` flag in production

4. **Rate Limiting**
   - Consider adding rate limiting to login endpoint
   - Monitor failed login attempts

## API Endpoints

### Admin Authentication

- `POST /api/admin/login` - Login
- `POST /api/admin/logout` - Logout
- `GET /api/admin/verify` - Verify session

### Content Management

- `DELETE /api/admin/news/[id]` - Delete article
- `PATCH /api/admin/news/[id]` - Update article (publish/unpublish)

## Usage Examples

### Login
```javascript
const response = await fetch('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'your_password',
  }),
});
```

### Verify Session
```javascript
const response = await fetch('/api/admin/verify');
const { authenticated, user } = await response.json();
```

### Logout
```javascript
await fetch('/api/admin/logout', { method: 'POST' });
```

## Customization

### Adding New Admin Pages

1. Create page in `app/admin/[page-name]/page.js`
2. Use `requireAdmin()` middleware
3. Add navigation link in `AdminSidebar.js`

### Custom Permissions

Currently, all authenticated admins have full access. To add role-based permissions:

1. Extend JWT payload with roles
2. Create permission middleware
3. Check permissions in routes

## Troubleshooting

### Can't Login
- Check environment variables are set
- Verify username/password match
- Check browser console for errors

### Session Expires Too Quickly
- Default is 24 hours
- Modify expiration in `lib/auth/adminAuth.js`

### Redirect Loop
- Clear cookies
- Check middleware logic
- Verify token verification

## Security Notes

- Admin panel is separate from public site
- No public access to admin routes
- All admin actions are logged (consider adding audit log)
- Consider adding 2FA for production
- Monitor admin access logs

---

For technical details, see the source code in:
- `lib/auth/adminAuth.js` - Authentication logic
- `lib/middleware/adminMiddleware.js` - Route protection
- `app/admin/*` - Admin pages
- `components/admin/*` - Admin components
