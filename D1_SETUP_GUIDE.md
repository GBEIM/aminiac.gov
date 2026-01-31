# Cloudflare D1 Database Setup Guide for Aminoac Government Message Board

## Overview
This guide will help you set up the Cloudflare D1 database for the Government Message Board feature on your Aminoac website.

## Prerequisites
- A Cloudflare account
- Wrangler CLI installed (Cloudflare's command-line tool)
- Access to your domain's Cloudflare Workers

## Step 1: Install Wrangler CLI

If you haven't installed Wrangler yet, run:

```bash
npm install -g wrangler
```

Then authenticate with Cloudflare:

```bash
wrangler login
```

## Step 2: Create D1 Database

Create a new D1 database named "user-info-aminoac":

```bash
wrangler d1 create user-info-aminoac
```

This command will output your database ID. Save this ID as you'll need it later.

## Step 3: Create Database Table

Create a SQL file to initialize your database table. Save this as `schema.sql`:

```sql
-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    approved BOOLEAN DEFAULT 0
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_created_at ON messages(created_at DESC);
```

Then execute the schema on your database:

```bash
wrangler d1 execute user-info-aminoac --file=schema.sql
```

## Step 4: Configure Wrangler

Create a `wrangler.toml` file in your project directory:

```toml
name = "aminoac-message-board"
main = "cloudflare-worker.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "User_Aminoac"
database_name = "user-info-aminoac"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with your database ID from Step 2
```

Replace `YOUR_DATABASE_ID_HERE` with the database ID you received in Step 2.

## Step 5: Deploy the Worker

Deploy your worker using Wrangler:

```bash
wrangler deploy
```

After deployment, you'll receive a Worker URL (e.g., `https://aminoac-message-board.your-account.workers.dev`).

## Step 6: Update Your HTML

In your `contact.html` file, update the API_ENDPOINT constant to point to your deployed worker:

```javascript
const API_ENDPOINT = 'https://aminoac-message-board.your-account.workers.dev/api/messages';
```

## Step 7: Set Up Custom Domain (Optional)

For a cleaner integration, you can set up a custom route:

1. Go to your Cloudflare dashboard
2. Navigate to Workers & Pages > Overview
3. Select your worker
4. Go to Settings > Triggers > Routes
5. Add a route like: `aminoac.gov.an/api/messages`

Then update the API_ENDPOINT in your HTML to use your custom domain.

## Database Management

### View Messages
To view all messages in your database:

```bash
wrangler d1 execute user-info-aminoac --command="SELECT * FROM messages ORDER BY created_at DESC LIMIT 10"
```

### Delete a Message
To delete a specific message by ID:

```bash
wrangler d1 execute user-info-aminoac --command="DELETE FROM messages WHERE id = YOUR_MESSAGE_ID"
```

### Clear All Messages
To clear all messages (use with caution):

```bash
wrangler d1 execute user-info-aminoac --command="DELETE FROM messages"
```

## Security Considerations

1. **Rate Limiting**: Consider implementing rate limiting to prevent spam
2. **Content Moderation**: The database includes an `approved` field for manual moderation
3. **Input Validation**: The worker validates email format and required fields
4. **CORS Configuration**: Update the CORS headers in the worker to restrict access to your domain only

Example of restricted CORS:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://aminoac.gov.an',  // Replace with your domain
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

## Testing

Test your setup by:

1. Opening the contact page in your browser
2. Submitting a test message
3. Verifying it appears in the Recent Messages section
4. Checking the database directly using the Wrangler CLI

## Troubleshooting

### Messages not appearing
- Check browser console for JavaScript errors
- Verify the API_ENDPOINT URL is correct
- Check worker logs: `wrangler tail`

### CORS errors
- Ensure CORS headers are properly configured
- Verify your domain is allowed in the Access-Control-Allow-Origin header

### Database connection errors
- Verify the database binding name matches in wrangler.toml and worker code
- Check that the database ID is correct
- Ensure you've deployed the latest version of the worker

## Additional Features (Optional)

### Admin Panel
You can create an admin panel to moderate messages by adding authentication and additional endpoints to approve/reject messages.

### Email Notifications
Integrate Cloudflare Email Workers to send notifications when new messages are submitted.

### Analytics
Track message submission patterns using Cloudflare Analytics or integrate with your analytics platform.

## Support

For issues related to:
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/

## Database Schema Reference

```
messages table:
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL (User's name)
- email: TEXT NOT NULL (User's email)
- message: TEXT NOT NULL (User's message)
- created_at: DATETIME NOT NULL (Timestamp)
- approved: BOOLEAN DEFAULT 0 (Moderation status)
```
