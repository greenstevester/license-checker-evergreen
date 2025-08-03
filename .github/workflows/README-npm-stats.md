# NPM Download Stats Report Workflow

This workflow automatically fetches NPM download statistics for the `license-checker-evergreen` package and sends a formatted HTML email report.

## Schedule

The workflow runs daily at 9:00 AM UTC. You can also trigger it manually from the Actions tab.

## Available Email Providers

### Option 1: Gmail (npm-stats-report.yml)

**Required Secrets:**
1. **EMAIL_USERNAME**: Your Gmail address
2. **EMAIL_PASSWORD**: App-specific password ([Generate here](https://support.google.com/accounts/answer/185833))
3. **EMAIL_TO**: Recipient email address
4. **EMAIL_FROM**: Sender email address (usually same as EMAIL_USERNAME)

### Option 2: SendGrid (npm-stats-report-sendgrid.yml) - Recommended

**Free tier:** 100 emails/day forever

**Required Secrets:**
1. **SENDGRID_API_KEY**: Your SendGrid API key ([Sign up free](https://sendgrid.com/free))
2. **EMAIL_TO**: Recipient email address
3. **EMAIL_FROM**: Verified sender email address in SendGrid

**Setup SendGrid:**
1. Create free account at [sendgrid.com](https://sendgrid.com/free)
2. Verify your sender email address
3. Generate an API key with "Mail Send" permissions
4. Add the API key as a GitHub secret

### Other Free Email Provider Options

- **MailerSend**: 3,000 emails/month free
- **SMTP2GO**: 1,000 emails/month free
- **Mailjet**: 6,000 emails/month (200/day limit)
- **Amazon SES**: Pay-as-you-go (very cheap)
- **Postmark**: 100 emails/month free

### Setting up Secrets

1. Go to your repository Settings
2. Navigate to Secrets and variables > Actions
3. Click "New repository secret"
4. Add each of the required secrets listed above

## Email Report Contents

The email report includes:
- Daily download count with percentage change from previous day
- Weekly download count with percentage change from previous week
- Monthly download count (last 30 days)
- Formatted HTML with a clean, responsive design

## Testing

To test the workflow:
1. Go to the Actions tab in your repository
2. Select "NPM Download Stats Report"
3. Click "Run workflow"
4. Check your configured email for the report

## Troubleshooting

If emails aren't being sent:
- Verify all secrets are correctly configured
- Check the workflow run logs in the Actions tab
- For Gmail, ensure you're using an app-specific password, not your regular password
- Make sure your email provider allows SMTP access