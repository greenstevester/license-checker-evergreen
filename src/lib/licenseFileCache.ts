/**
 * LicenseFileCache - Eliminates redundant file system reads for license files
 * 
 * This cache ensures that each license file is read exactly once during the
 * license scanning process, providing significant performance improvements
 * for projects with many packages.
 */

import fs from 'node:fs';
import { createHash } from 'crypto';

interface CacheEntry {
	content: string;
	checksum?: string;
	readTime: number;
}

export class LicenseFileCache {
	private cache = new Map<string, CacheEntry>();
	private stats = {
		hits: 0,
		misses: 0,
		totalReads: 0
	};

	/**
	 * Read a license file with caching
	 * @param filePath - Absolute path to the license file
	 * @param generateChecksum - Whether to generate SHA-256 checksum
	 * @returns File content and optional checksum
	 */
	readLicenseFile(filePath: string, generateChecksum = false): { content: string; checksum?: string } {
		this.stats.totalReads++;

		if (this.cache.has(filePath)) {
			this.stats.hits++;
			const entry = this.cache.get(filePath)!;
			
			// Generate checksum on demand if not cached
			if (generateChecksum && !entry.checksum) {
				entry.checksum = createHash('sha256').update(entry.content).digest('hex');
			}
			
			return {
				content: entry.content,
				checksum: entry.checksum
			};
		}

		// Cache miss - read from filesystem
		this.stats.misses++;
		
		try {
			const content = fs.readFileSync(filePath, { encoding: 'utf8' });
			const checksum = generateChecksum ? createHash('sha256').update(content).digest('hex') : undefined;
			
			// Store in cache
			this.cache.set(filePath, {
				content,
				checksum,
				readTime: Date.now()
			});

			return { content, checksum };
		} catch (error) {
			// Don't cache errors, let them propagate
			throw error;
		}
	}

	/**
	 * Check if file exists and is readable (with caching)
	 */
	fileExists(filePath: string): boolean {
		try {
			// If we already have it cached, it exists
			if (this.cache.has(filePath)) {
				return true;
			}
			
			// Check filesystem
			return fs.existsSync(filePath) && fs.lstatSync(filePath).isFile();
		} catch {
			return false;
		}
	}

	/**
	 * Get cache statistics for performance monitoring
	 */
	getStats(): { hits: number; misses: number; totalReads: number; hitRate: number; cacheSize: number } {
		return {
			...this.stats,
			hitRate: this.stats.totalReads > 0 ? this.stats.hits / this.stats.totalReads : 0,
			cacheSize: this.cache.size
		};
	}

	/**
	 * Clear the cache (useful for testing or memory management)
	 */
	clear(): void {
		this.cache.clear();
		this.stats = { hits: 0, misses: 0, totalReads: 0 };
	}

	/**
	 * Remove old entries to prevent memory bloat
	 * @param maxAge - Maximum age in milliseconds (default: 1 hour)
	 */
	cleanup(maxAge = 60 * 60 * 1000): void {
		const now = Date.now();
		for (const [filePath, entry] of this.cache.entries()) {
			if (now - entry.readTime > maxAge) {
				this.cache.delete(filePath);
			}
		}
	}
}

// Export a singleton instance for use across the application
export const licenseFileCache = new LicenseFileCache();