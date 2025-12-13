#!/usr/bin/env npx ts-node --esm

/**
 * Competitor Package Tracker
 *
 * Tracks dependents and usage statistics of competitor npm packages
 * to identify potential migration targets for license-checker-evergreen.
 *
 * Data Sources:
 * - Libraries.io API (dependents, SourceRank)
 * - npm Registry API (download stats)
 * - GitHub API (repository dependents)
 *
 * @module competitor-tracker
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// Configuration
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface TrackedPackage {
	name: string;
	npmUrl: string;
	githubRepo: string;
}

const TRACKED_PACKAGES: TrackedPackage[] = [
	{
		name: 'license-checker',
		npmUrl: 'https://www.npmjs.com/package/license-checker',
		githubRepo: 'davglass/license-checker',
	},
	{
		name: 'license-checker-rseidelsohn',
		npmUrl: 'https://www.npmjs.com/package/license-checker-rseidelsohn',
		githubRepo: 'RSeidelsohn/license-checker-rseidelsohn',
	},
];

const OUR_PACKAGE = {
	name: 'license-checker-evergreen',
	npmUrl: 'https://www.npmjs.com/package/license-checker-evergreen',
	githubRepo: 'greenstevester/license-checker-evergreen',
};

const DATA_FILE = path.join(__dirname, '..', 'data', 'competitor-tracking.json');

// API endpoints
const NPM_REGISTRY = 'https://registry.npmjs.org';
const NPM_API = 'https://api.npmjs.org';
const LIBRARIES_IO_API = 'https://libraries.io/api';

// ============================================================================
// Types
// ============================================================================

interface NpmPackageInfo {
	name: string;
	'dist-tags': { latest: string };
	time: Record<string, string>;
	versions: Record<string, unknown>;
}

interface NpmDownloadStats {
	downloads: number;
	start: string;
	end: string;
	package: string;
}

interface LibrariesIoPackage {
	dependent_repos_count: number;
	dependents_count: number;
	downloads: number;
	rank: number;
	stars: number;
	forks: number;
	latest_release_published_at: string;
	repository_url: string;
}

interface LibrariesIoDependent {
	name: string;
	platform: string;
	description: string;
	homepage: string;
	repository_url: string;
	stars: number;
	rank: number;
}

interface GitHubDependent {
	name: string;
	fullName: string;
	url: string;
	stars: number;
	description: string;
}

interface PackageStats {
	name: string;
	fetchedAt: string;
	npm: {
		weeklyDownloads: number;
		monthlyDownloads: number;
		lastPublished: string;
		latestVersion: string;
	};
	librariesIo: {
		dependentReposCount: number;
		dependentsCount: number;
		rank: number;
		stars: number;
		forks: number;
	} | null;
	topDependents: LibrariesIoDependent[];
	githubDependents: GitHubDependent[];
}

interface TrackingSnapshot {
	timestamp: string;
	packages: Record<string, PackageStats>;
	newDependentsSinceLastRun: Record<string, string[]>;
}

interface TrackingData {
	lastRun: string;
	snapshots: TrackingSnapshot[];
	knownDependents: Record<string, Set<string> | string[]>;
}

// ============================================================================
// API Fetchers
// ============================================================================

async function fetchWithRetry(
	url: string,
	options: RequestInit = {},
	retries = 3
): Promise<Response> {
	for (let i = 0; i < retries; i++) {
		try {
			const response = await fetch(url, {
				...options,
				headers: {
					'User-Agent': 'license-checker-evergreen-tracker/1.0',
					...options.headers,
				},
			});

			if (response.status === 429) {
				// Rate limited - wait and retry
				const waitTime = Math.pow(2, i) * 1000;
				console.log(`Rate limited, waiting ${waitTime}ms...`);
				await new Promise((resolve) => setTimeout(resolve, waitTime));
				continue;
			}

			return response;
		} catch (error) {
			if (i === retries - 1) throw error;
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
	throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

async function fetchNpmPackageInfo(packageName: string): Promise<NpmPackageInfo | null> {
	try {
		const response = await fetchWithRetry(`${NPM_REGISTRY}/${packageName}`);
		if (!response.ok) return null;
		return (await response.json()) as NpmPackageInfo;
	} catch (error) {
		console.error(`Failed to fetch npm info for ${packageName}:`, error);
		return null;
	}
}

async function fetchNpmDownloads(
	packageName: string,
	period: string
): Promise<NpmDownloadStats | null> {
	try {
		const response = await fetchWithRetry(`${NPM_API}/downloads/point/${period}/${packageName}`);
		if (!response.ok) return null;
		return (await response.json()) as NpmDownloadStats;
	} catch (error) {
		console.error(`Failed to fetch npm downloads for ${packageName}:`, error);
		return null;
	}
}

async function fetchLibrariesIoPackage(packageName: string): Promise<LibrariesIoPackage | null> {
	const apiKey = process.env.LIBRARIES_IO_API_KEY;
	if (!apiKey) {
		console.log('LIBRARIES_IO_API_KEY not set, skipping Libraries.io data');
		return null;
	}

	try {
		const response = await fetchWithRetry(
			`${LIBRARIES_IO_API}/npm/${packageName}?api_key=${apiKey}`
		);
		if (!response.ok) return null;
		return (await response.json()) as LibrariesIoPackage;
	} catch (error) {
		console.error(`Failed to fetch Libraries.io data for ${packageName}:`, error);
		return null;
	}
}

interface LibrariesIoDependentRepo {
	full_name: string;
	description: string;
	homepage: string;
	stargazers_count: number;
	rank: number;
	language: string;
	license: string;
}

async function fetchLibrariesIoDependents(
	packageName: string,
	limit = 30
): Promise<LibrariesIoDependent[]> {
	const apiKey = process.env.LIBRARIES_IO_API_KEY;
	if (!apiKey) return [];

	try {
		// Use dependent_repositories endpoint for GitHub repos that use this package
		const response = await fetchWithRetry(
			`${LIBRARIES_IO_API}/npm/${packageName}/dependent_repositories?api_key=${apiKey}&per_page=${limit}`
		);
		if (!response.ok) return [];
		const data = await response.json();

		// Ensure we always return an array
		if (!Array.isArray(data)) {
			console.log(`Libraries.io returned non-array for ${packageName} dependents:`, typeof data);
			return [];
		}

		// Map the response to our LibrariesIoDependent interface and deduplicate
		const seen = new Set<string>();
		return (data as LibrariesIoDependentRepo[])
			.filter((repo) => {
				if (seen.has(repo.full_name)) return false;
				seen.add(repo.full_name);
				return true;
			})
			.map((repo) => ({
				name: repo.full_name,
				platform: 'GitHub',
				description: repo.description || '',
				homepage: repo.homepage || '',
				repository_url: `https://github.com/${repo.full_name}`,
				stars: repo.stargazers_count,
				rank: repo.rank,
			}));
	} catch (error) {
		console.error(`Failed to fetch dependents for ${packageName}:`, error);
		return [];
	}
}

async function fetchGitHubDependents(
	owner: string,
	repo: string,
	limit = 20
): Promise<GitHubDependent[]> {
	const token = process.env.GITHUB_TOKEN;
	if (!token) {
		console.log('GITHUB_TOKEN not set, skipping GitHub dependents');
		return [];
	}

	try {
		// GitHub's dependency graph API via GraphQL
		const query = `
			query($owner: String!, $repo: String!) {
				repository(owner: $owner, name: $repo) {
					dependents(first: ${limit}) {
						nodes {
							... on Repository {
								name
								nameWithOwner
								url
								stargazerCount
								description
							}
						}
						totalCount
					}
				}
			}
		`;

		const response = await fetchWithRetry('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ query, variables: { owner, repo } }),
		});

		if (!response.ok) {
			console.log('GitHub GraphQL query failed, trying REST API fallback');
			return [];
		}

		const data = (await response.json()) as {
			data?: {
				repository?: {
					dependents?: {
						nodes: Array<{
							name: string;
							nameWithOwner: string;
							url: string;
							stargazerCount: number;
							description: string;
						}>;
					};
				};
			};
		};
		const nodes = data.data?.repository?.dependents?.nodes || [];

		return nodes.map((node) => ({
			name: node.name,
			fullName: node.nameWithOwner,
			url: node.url,
			stars: node.stargazerCount,
			description: node.description || '',
		}));
	} catch (error) {
		console.error(`Failed to fetch GitHub dependents for ${owner}/${repo}:`, error);
		return [];
	}
}

// ============================================================================
// Data Collection
// ============================================================================

async function collectPackageStats(pkg: TrackedPackage): Promise<PackageStats> {
	console.log(`\n📦 Collecting stats for ${pkg.name}...`);

	const [npmInfo, weeklyDownloads, monthlyDownloads, librariesIo, dependents, githubDependents] =
		await Promise.all([
			fetchNpmPackageInfo(pkg.name),
			fetchNpmDownloads(pkg.name, 'last-week'),
			fetchNpmDownloads(pkg.name, 'last-month'),
			fetchLibrariesIoPackage(pkg.name),
			fetchLibrariesIoDependents(pkg.name),
			fetchGitHubDependents(...(pkg.githubRepo.split('/') as [string, string])),
		]);

	const latestVersion = npmInfo?.['dist-tags']?.latest || 'unknown';
	const lastPublished = npmInfo?.time?.[latestVersion] || 'unknown';

	return {
		name: pkg.name,
		fetchedAt: new Date().toISOString(),
		npm: {
			weeklyDownloads: weeklyDownloads?.downloads || 0,
			monthlyDownloads: monthlyDownloads?.downloads || 0,
			lastPublished,
			latestVersion,
		},
		librariesIo: librariesIo
			? {
					dependentReposCount: librariesIo.dependent_repos_count,
					dependentsCount: librariesIo.dependents_count,
					rank: librariesIo.rank,
					stars: librariesIo.stars,
					forks: librariesIo.forks,
				}
			: null,
		topDependents: dependents,
		githubDependents,
	};
}

// ============================================================================
// Data Persistence
// ============================================================================

async function loadTrackingData(): Promise<TrackingData> {
	try {
		const data = await fs.readFile(DATA_FILE, 'utf-8');
		const parsed = JSON.parse(data) as TrackingData;
		// Convert string arrays back to Sets for knownDependents
		for (const pkg of Object.keys(parsed.knownDependents)) {
			if (Array.isArray(parsed.knownDependents[pkg])) {
				parsed.knownDependents[pkg] = new Set(parsed.knownDependents[pkg] as string[]);
			}
		}
		return parsed;
	} catch {
		return {
			lastRun: '',
			snapshots: [],
			knownDependents: {},
		};
	}
}

async function saveTrackingData(data: TrackingData): Promise<void> {
	// Ensure directory exists
	await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

	// Convert Sets to arrays for JSON serialization
	const serializableData = {
		...data,
		knownDependents: Object.fromEntries(
			Object.entries(data.knownDependents).map(([key, value]) => [
				key,
				value instanceof Set ? Array.from(value) : value,
			])
		),
	};

	await fs.writeFile(DATA_FILE, JSON.stringify(serializableData, null, 2));
}

function findNewDependents(
	currentDependents: (LibrariesIoDependent | GitHubDependent)[],
	knownDependents: Set<string>
): string[] {
	const currentNames = currentDependents.map((d) => ('fullName' in d ? d.fullName : d.name));
	return currentNames.filter((name) => !knownDependents.has(name));
}

// ============================================================================
// Report Generation
// ============================================================================

function generateHTMLReport(
	snapshot: TrackingSnapshot,
	ourStats: PackageStats,
	previousSnapshot?: TrackingSnapshot
): string {
	const currentDate = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	const formatChange = (current: number, previous: number): string => {
		if (!previous) return '';
		const change = ((current - previous) / previous) * 100;
		const formatted = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
		const color = change >= 0 ? '#27ae60' : '#e74c3c';
		return `<span style="color: ${color}; font-size: 14px;">${formatted}</span>`;
	};

	const packageCards = Object.values(snapshot.packages)
		.map((pkg) => {
			const prevPkg = previousSnapshot?.packages[pkg.name];
			const newDeps = snapshot.newDependentsSinceLastRun[pkg.name] || [];

			return `
			<div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #3498db;">
				<h3 style="margin: 0 0 15px 0; color: #2c3e50;">
					<a href="https://www.npmjs.com/package/${pkg.name}" style="color: #3498db; text-decoration: none;">${pkg.name}</a>
				</h3>

				<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px;">
					<div>
						<div style="font-size: 12px; color: #6c757d;">Weekly Downloads</div>
						<div style="font-size: 20px; font-weight: bold; color: #2c3e50;">
							${pkg.npm.weeklyDownloads.toLocaleString()}
							${prevPkg ? formatChange(pkg.npm.weeklyDownloads, prevPkg.npm.weeklyDownloads) : ''}
						</div>
					</div>
					<div>
						<div style="font-size: 12px; color: #6c757d;">Monthly Downloads</div>
						<div style="font-size: 20px; font-weight: bold; color: #2c3e50;">
							${pkg.npm.monthlyDownloads.toLocaleString()}
						</div>
					</div>
					${
						pkg.librariesIo
							? `
					<div>
						<div style="font-size: 12px; color: #6c757d;">Dependent Repos</div>
						<div style="font-size: 20px; font-weight: bold; color: #2c3e50;">
							${pkg.librariesIo.dependentReposCount.toLocaleString()}
						</div>
					</div>
					<div>
						<div style="font-size: 12px; color: #6c757d;">SourceRank</div>
						<div style="font-size: 20px; font-weight: bold; color: #2c3e50;">${pkg.librariesIo.rank}</div>
					</div>
					`
							: ''
					}
				</div>

				${
					newDeps.length > 0
						? `
				<div style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 4px;">
					<strong style="color: #27ae60;">🆕 ${newDeps.length} New Dependent(s):</strong>
					<ul style="margin: 5px 0 0 0; padding-left: 20px;">
						${newDeps.slice(0, 5).map((d) => `<li>${d}</li>`).join('')}
						${newDeps.length > 5 ? `<li>... and ${newDeps.length - 5} more</li>` : ''}
					</ul>
				</div>
				`
						: ''
				}

				${
					pkg.topDependents.length > 0
						? `
				<div style="margin-top: 15px;">
					<strong>Top Dependents (potential migration targets):</strong>
					<table style="width: 100%; margin-top: 10px; border-collapse: collapse; font-size: 13px;">
						<thead>
							<tr style="background: #e9ecef;">
								<th style="padding: 8px; text-align: left;">Package</th>
								<th style="padding: 8px; text-align: right;">Stars</th>
								<th style="padding: 8px; text-align: right;">Rank</th>
							</tr>
						</thead>
						<tbody>
							${pkg.topDependents
								.slice(0, 10)
								.map(
									(dep) => `
								<tr style="border-bottom: 1px solid #e9ecef;">
									<td style="padding: 8px;">
										<a href="${dep.repository_url || dep.homepage || '#'}" style="color: #3498db;">${dep.name}</a>
									</td>
									<td style="padding: 8px; text-align: right;">${dep.stars?.toLocaleString() || '-'}</td>
									<td style="padding: 8px; text-align: right;">${dep.rank || '-'}</td>
								</tr>
							`
								)
								.join('')}
						</tbody>
					</table>
				</div>
				`
						: ''
				}
			</div>
		`;
		})
		.join('');

	// Our package comparison section
	const ourPackageSection = `
		<div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #27ae60;">
			<h3 style="margin: 0 0 15px 0; color: #27ae60;">
				📊 Our Package: ${ourStats.name}
			</h3>
			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px;">
				<div>
					<div style="font-size: 12px; color: #6c757d;">Weekly Downloads</div>
					<div style="font-size: 24px; font-weight: bold; color: #27ae60;">
						${ourStats.npm.weeklyDownloads.toLocaleString()}
					</div>
				</div>
				<div>
					<div style="font-size: 12px; color: #6c757d;">Monthly Downloads</div>
					<div style="font-size: 24px; font-weight: bold; color: #27ae60;">
						${ourStats.npm.monthlyDownloads.toLocaleString()}
					</div>
				</div>
				<div>
					<div style="font-size: 12px; color: #6c757d;">Latest Version</div>
					<div style="font-size: 20px; font-weight: bold; color: #27ae60;">
						${ourStats.npm.latestVersion}
					</div>
				</div>
			</div>
		</div>
	`;

	// Market share calculation
	const totalWeeklyDownloads = Object.values(snapshot.packages).reduce(
		(sum, pkg) => sum + pkg.npm.weeklyDownloads,
		ourStats.npm.weeklyDownloads
	);

	const marketShareSection = `
		<div style="background: #fff3cd; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
			<h3 style="margin: 0 0 15px 0; color: #856404;">📈 Market Position</h3>
			<div style="display: flex; gap: 20px; flex-wrap: wrap;">
				<div>
					<div style="font-size: 12px; color: #6c757d;">Our Market Share</div>
					<div style="font-size: 28px; font-weight: bold; color: #856404;">
						${((ourStats.npm.weeklyDownloads / totalWeeklyDownloads) * 100).toFixed(2)}%
					</div>
				</div>
				<div>
					<div style="font-size: 12px; color: #6c757d;">Total Weekly Downloads (All Packages)</div>
					<div style="font-size: 20px; font-weight: bold; color: #856404;">
						${totalWeeklyDownloads.toLocaleString()}
					</div>
				</div>
			</div>
		</div>
	`;

	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Competitor Tracking Report</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
	<div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
		<h1 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
			🎯 Competitor Tracking Report
		</h1>

		<p><strong>Report Date:</strong> ${currentDate}</p>
		<p><strong>Tracked Packages:</strong> ${TRACKED_PACKAGES.map((p) => p.name).join(', ')}</p>

		${ourPackageSection}
		${marketShareSection}

		<h2 style="color: #2c3e50; margin-top: 30px;">Competitor Analysis</h2>
		${packageCards}

		<div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
			<h3 style="margin: 0 0 10px 0; color: #2c3e50;">🎯 Suggested Outreach Actions</h3>
			<ul style="margin: 0; padding-left: 20px;">
				${Object.entries(snapshot.newDependentsSinceLastRun)
					.filter(([, deps]) => deps.length > 0)
					.map(
						([pkg, deps]) =>
							`<li>New dependents of <strong>${pkg}</strong>: Consider reaching out to ${deps.slice(0, 3).join(', ')}${deps.length > 3 ? ` and ${deps.length - 3} more` : ''}</li>`
					)
					.join('')}
				<li>High-star repos using competitors are prime migration candidates</li>
				<li>Focus outreach on packages with recent activity (check last publish date)</li>
			</ul>
		</div>

		<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; text-align: center;">
			<p>This automated report is generated weekly by GitHub Actions.</p>
			<p>
				<a href="https://www.npmjs.com/package/license-checker-evergreen" style="color: #3498db;">npm</a> |
				<a href="https://github.com/greenstevester/license-checker-evergreen" style="color: #3498db;">GitHub</a> |
				<a href="https://libraries.io/npm/license-checker-evergreen" style="color: #3498db;">Libraries.io</a>
			</p>
		</div>
	</div>
</body>
</html>`;
}

function generateMarkdownReport(snapshot: TrackingSnapshot, ourStats: PackageStats): string {
	const lines: string[] = [
		'# Competitor Tracking Report',
		'',
		`**Generated:** ${new Date().toISOString()}`,
		'',
		'## Our Package: license-checker-evergreen',
		'',
		`| Metric | Value |`,
		`|--------|-------|`,
		`| Weekly Downloads | ${ourStats.npm.weeklyDownloads.toLocaleString()} |`,
		`| Monthly Downloads | ${ourStats.npm.monthlyDownloads.toLocaleString()} |`,
		`| Latest Version | ${ourStats.npm.latestVersion} |`,
		'',
		'## Competitor Packages',
		'',
	];

	for (const [, pkg] of Object.entries(snapshot.packages)) {
		lines.push(`### ${pkg.name}`);
		lines.push('');
		lines.push(`| Metric | Value |`);
		lines.push(`|--------|-------|`);
		lines.push(`| Weekly Downloads | ${pkg.npm.weeklyDownloads.toLocaleString()} |`);
		lines.push(`| Monthly Downloads | ${pkg.npm.monthlyDownloads.toLocaleString()} |`);
		lines.push(`| Latest Version | ${pkg.npm.latestVersion} |`);
		lines.push(`| Last Published | ${pkg.npm.lastPublished} |`);

		if (pkg.librariesIo) {
			lines.push(`| Dependent Repos | ${pkg.librariesIo.dependentReposCount.toLocaleString()} |`);
			lines.push(`| SourceRank | ${pkg.librariesIo.rank} |`);
		}

		const newDeps = snapshot.newDependentsSinceLastRun[pkg.name] || [];
		if (newDeps.length > 0) {
			lines.push('');
			lines.push(`**New Dependents This Week:** ${newDeps.length}`);
			lines.push('');
			newDeps.slice(0, 10).forEach((dep) => lines.push(`- ${dep}`));
			if (newDeps.length > 10) {
				lines.push(`- ... and ${newDeps.length - 10} more`);
			}
		}

		if (pkg.topDependents.length > 0) {
			lines.push('');
			lines.push('**Top Dependents (Migration Targets):**');
			lines.push('');
			lines.push('| Package | Stars | Rank |');
			lines.push('|---------|-------|------|');
			pkg.topDependents.slice(0, 10).forEach((dep) => {
				lines.push(`| [${dep.name}](${dep.repository_url || '#'}) | ${dep.stars || '-'} | ${dep.rank || '-'} |`);
			});
		}

		lines.push('');
	}

	return lines.join('\n');
}

// ============================================================================
// Email Sending
// ============================================================================

async function sendEmailReport(htmlReport: string): Promise<void> {
	const sesClient = new SESClient({
		region: process.env.AWS_REGION || 'eu-west-1',
	});

	const emailTo = process.env.EMAIL_TO;
	const emailFrom = process.env.EMAIL_FROM;

	if (!emailTo || !emailFrom) {
		console.log('EMAIL_TO or EMAIL_FROM not set, skipping email');
		return;
	}

	const params = {
		Destination: {
			ToAddresses: [emailTo],
		},
		Message: {
			Body: {
				Html: {
					Data: htmlReport,
					Charset: 'UTF-8',
				},
			},
			Subject: {
				Data: `🎯 Competitor Tracking Report - ${new Date().toLocaleDateString()}`,
				Charset: 'UTF-8',
			},
		},
		Source: emailFrom,
	};

	const command = new SendEmailCommand(params);
	await sesClient.send(command);
	console.log('✅ Email report sent successfully!');
}

// ============================================================================
// Main Execution
// ============================================================================

async function main(): Promise<void> {
	console.log('🎯 Starting Competitor Tracking...');
	console.log('================================\n');

	// Load previous data
	const trackingData = await loadTrackingData();
	const previousSnapshot = trackingData.snapshots[trackingData.snapshots.length - 1];

	// Collect stats for our package
	console.log('📊 Collecting our package stats...');
	const ourStats = await collectPackageStats(OUR_PACKAGE);

	// Collect stats for tracked competitors
	const packageStats: Record<string, PackageStats> = {};
	for (const pkg of TRACKED_PACKAGES) {
		packageStats[pkg.name] = await collectPackageStats(pkg);
	}

	// Find new dependents
	const newDependentsSinceLastRun: Record<string, string[]> = {};
	for (const [pkgName, stats] of Object.entries(packageStats)) {
		const knownDeps =
			trackingData.knownDependents[pkgName] instanceof Set
				? (trackingData.knownDependents[pkgName] as Set<string>)
				: new Set(trackingData.knownDependents[pkgName] || []);

		const allCurrentDependents = [...(stats.topDependents || []), ...(stats.githubDependents || [])];
		const newDeps = findNewDependents(allCurrentDependents, knownDeps);
		newDependentsSinceLastRun[pkgName] = newDeps;

		// Update known dependents
		allCurrentDependents.forEach((d) =>
			knownDeps.add('fullName' in d ? d.fullName : d.name)
		);
		trackingData.knownDependents[pkgName] = knownDeps;

		if (newDeps.length > 0) {
			console.log(`\n🆕 Found ${newDeps.length} new dependents for ${pkgName}`);
		}
	}

	// Create snapshot
	const snapshot: TrackingSnapshot = {
		timestamp: new Date().toISOString(),
		packages: packageStats,
		newDependentsSinceLastRun,
	};

	// Keep last 52 snapshots (1 year of weekly data)
	trackingData.snapshots.push(snapshot);
	if (trackingData.snapshots.length > 52) {
		trackingData.snapshots = trackingData.snapshots.slice(-52);
	}
	trackingData.lastRun = snapshot.timestamp;

	// Save data
	await saveTrackingData(trackingData);
	console.log('\n💾 Tracking data saved');

	// Generate reports
	const htmlReport = generateHTMLReport(snapshot, ourStats, previousSnapshot);
	const markdownReport = generateMarkdownReport(snapshot, ourStats);

	// Save markdown report
	const reportsDir = path.join(__dirname, '..', 'data');
	await fs.mkdir(reportsDir, { recursive: true });
	await fs.writeFile(path.join(reportsDir, 'latest-competitor-report.md'), markdownReport);
	console.log('📝 Markdown report saved to data/latest-competitor-report.md');

	// Send email if configured
	if (process.env.EMAIL_TO) {
		await sendEmailReport(htmlReport);
	}

	// Print summary
	console.log('\n================================');
	console.log('📊 Summary');
	console.log('================================\n');

	console.log(`Our Package (${ourStats.name}):`);
	console.log(`  Weekly: ${ourStats.npm.weeklyDownloads.toLocaleString()}`);
	console.log(`  Monthly: ${ourStats.npm.monthlyDownloads.toLocaleString()}\n`);

	for (const [, pkg] of Object.entries(packageStats)) {
		console.log(`${pkg.name}:`);
		console.log(`  Weekly: ${pkg.npm.weeklyDownloads.toLocaleString()}`);
		console.log(`  Monthly: ${pkg.npm.monthlyDownloads.toLocaleString()}`);
		if (pkg.librariesIo) {
			console.log(`  Dependent Repos: ${pkg.librariesIo.dependentReposCount.toLocaleString()}`);
		}
		const newDeps = newDependentsSinceLastRun[pkg.name] || [];
		if (newDeps.length > 0) {
			console.log(`  🆕 New Dependents: ${newDeps.length}`);
		}
		console.log('');
	}

	// Calculate and display market share
	const totalWeekly =
		ourStats.npm.weeklyDownloads +
		Object.values(packageStats).reduce((sum, p) => sum + p.npm.weeklyDownloads, 0);

	const ourShare = ((ourStats.npm.weeklyDownloads / totalWeekly) * 100).toFixed(2);
	console.log(`📈 Our Market Share: ${ourShare}%`);

	console.log('\n✅ Competitor tracking complete!');
}

main().catch((error) => {
	console.error('❌ Error:', error);
	process.exit(1);
});
