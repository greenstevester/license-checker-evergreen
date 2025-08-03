#!/usr/bin/env node

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const PACKAGE_NAME = 'license-checker-evergreen';
const NPM_API_BASE = 'https://api.npmjs.org/downloads';

// Initialize AWS SES client
const sesClient = new SESClient({
	region: process.env.AWS_REGION || 'eu-west-1'
});

async function fetchDownloadStats(period) {
	const url = `${NPM_API_BASE}/point/${period}/${PACKAGE_NAME}`;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${period} stats: ${response.statusText}`);
	}
	return response.json();
}

async function fetchDownloadRange(startDate, endDate) {
	const url = `${NPM_API_BASE}/range/${startDate}:${endDate}/${PACKAGE_NAME}`;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch range stats: ${response.statusText}`);
	}
	return response.json();
}

function formatDate(date) {
	return date.toISOString().split('T')[0];
}

function calculatePercentageChange(current, previous) {
	if (previous === 0) return 'N/A';
	const change = ((current - previous) / previous) * 100;
	return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
}

function generateHTMLReport(stats) {
	const { daily, weekly, monthly, comparison } = stats;
	const currentDate = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-box {
            background-color: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            text-align: center;
            border: 1px solid #e9ecef;
        }
        .stat-label {
            font-size: 14px;
            color: #6c757d;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        .stat-change {
            font-size: 16px;
            font-weight: 500;
        }
        .positive {
            color: #27ae60;
        }
        .negative {
            color: #e74c3c;
        }
        .neutral {
            color: #6c757d;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 14px;
            color: #6c757d;
            text-align: center;
        }
        .package-link {
            color: #3498db;
            text-decoration: none;
        }
        .package-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 NPM Download Statistics Report</h1>

        <p><strong>Package:</strong> <a href="https://www.npmjs.com/package/${PACKAGE_NAME}" class="package-link">${PACKAGE_NAME}</a></p>
        <p><strong>Report Date:</strong> ${currentDate}</p>

        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-label">Daily Downloads</div>
                <div class="stat-value">${daily.downloads.toLocaleString()}</div>
                <div class="stat-change ${comparison.dailyChange.startsWith('+') ? 'positive' : comparison.dailyChange.startsWith('-') ? 'negative' : 'neutral'}">
                    ${comparison.dailyChange}
                </div>
            </div>

            <div class="stat-box">
                <div class="stat-label">Weekly Downloads</div>
                <div class="stat-value">${weekly.downloads.toLocaleString()}</div>
                <div class="stat-change ${comparison.weeklyChange.startsWith('+') ? 'positive' : comparison.weeklyChange.startsWith('-') ? 'negative' : 'neutral'}">
                    ${comparison.weeklyChange}
                </div>
            </div>

            <div class="stat-box">
                <div class="stat-label">Monthly Downloads</div>
                <div class="stat-value">${monthly.downloads.toLocaleString()}</div>
                <div class="stat-change neutral">Last 30 days</div>
            </div>
        </div>

        <div class="footer">
            <p>This automated report is generated daily by GitHub Actions.</p>
            <p>View the package on <a href="https://www.npmjs.com/package/${PACKAGE_NAME}" class="package-link">npm</a> |
               <a href="https://github.com/evergreen-codes/license-checker-evergreen" class="package-link">GitHub</a></p>
        </div>
    </div>
</body>
</html>`;
}

async function main() {
	try {
		console.log(`Fetching NPM download statistics for ${PACKAGE_NAME}...`);

		// Get current stats
		const [dailyStats, weeklyStats, monthlyStats] = await Promise.all([
			fetchDownloadStats('last-day'),
			fetchDownloadStats('last-week'),
			fetchDownloadStats('last-month')
		]);

		// Calculate dates for comparison
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const twoDaysAgo = new Date(today);
		twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

		const lastWeekStart = new Date(today);
		lastWeekStart.setDate(lastWeekStart.getDate() - 14);
		const lastWeekEnd = new Date(today);
		lastWeekEnd.setDate(lastWeekEnd.getDate() - 8);

		// Fetch previous period data for comparison
		const [previousDayData, previousWeekData] = await Promise.all([
			fetchDownloadRange(formatDate(twoDaysAgo), formatDate(twoDaysAgo)),
			fetchDownloadRange(formatDate(lastWeekStart), formatDate(lastWeekEnd))
		]);

		// Calculate previous period totals
		const previousDayDownloads = previousDayData.downloads[0]?.downloads || 0;
		const previousWeekDownloads = previousWeekData.downloads.reduce((sum, day) => sum + day.downloads, 0);

		// Calculate percentage changes
		const dailyChange = calculatePercentageChange(dailyStats.downloads, previousDayDownloads);
		const weeklyChange = calculatePercentageChange(weeklyStats.downloads, previousWeekDownloads);

		const stats = {
			daily: dailyStats,
			weekly: weeklyStats,
			monthly: monthlyStats,
			comparison: {
				dailyChange,
				weeklyChange
			}
		};

		// Generate HTML report
		const htmlReport = generateHTMLReport(stats);

		// Send email via AWS SES
		const params = {
			Destination: {
				ToAddresses: [process.env.EMAIL_TO]
			},
			Message: {
				Body: {
					Html: {
						Data: htmlReport,
						Charset: 'UTF-8'
					}
				},
				Subject: {
					Data: `NPM Download Stats Report - ${PACKAGE_NAME} - ${new Date().toLocaleDateString()}`,
					Charset: 'UTF-8'
				}
			},
			Source: process.env.EMAIL_FROM
		};

		const command = new SendEmailCommand(params);
		await sesClient.send(command);

		console.log('✅ Report sent successfully via AWS SES!');
		console.log(`📊 Daily: ${dailyStats.downloads} (${dailyChange})`);
		console.log(`📊 Weekly: ${weeklyStats.downloads} (${weeklyChange})`);
		console.log(`📊 Monthly: ${monthlyStats.downloads}`);

	} catch (error) {
		console.error('❌ Error generating/sending report:', error.message);
		process.exit(1);
	}
}

main();
