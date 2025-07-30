/**
 * Memory-efficient package collection with object pooling and streaming
 * Manages package instances with minimal memory footprint
 */

import type { PackageInfo, PackageData } from './packageInfo.js';
import type { LicenseFileCache } from './licenseFileCache.js';

export interface CollectionStats {
	totalPackages: number;
	memoryUsage: number;
	cacheHitRate: number;
	pooledObjects: number;
}

export class PackageCollection {
	private packages = new Map<string, PackageInfo>();
	private processedPackages = new Map<string, PackageData>();
	private objectPool: PackageData[] = [];
	private readonly maxPoolSize = 100;
	private memoryUsage = 0;
	private cacheHits = 0;
	private totalRequests = 0;

	constructor(private readonly cache: LicenseFileCache) {}

	/**
	 * Add package with memory-efficient storage
	 */
	addPackage(packageInfo: PackageInfo): void {
		const key = `${packageInfo.name}@${packageInfo.version}`;

		// Check if we already have this package to avoid duplicates
		if (this.packages.has(key)) {
			return;
		}

		this.packages.set(key, packageInfo);
	}

	/**
	 * Get package data with caching and lazy evaluation
	 */
	getPackageData(name: string, version: string, includeText = false): PackageData | null {
		const key = `${name}@${version}`;
		this.totalRequests++;

		// Check processed cache first
		if (this.processedPackages.has(key)) {
			this.cacheHits++;
			return this.processedPackages.get(key)!;
		}

		const packageInfo = this.packages.get(key);
		if (!packageInfo) {
			return null;
		}

		// Generate data based on requirements
		const data = includeText ?
			packageInfo.toPackageDataWithText() :
			packageInfo.toPackageData();

		// Cache the result
		this.processedPackages.set(key, data);
		this.memoryUsage += this.estimateObjectSize(data);

		return data;
	}

	/**
	 * Stream packages for memory-efficient processing
	 */
	*streamPackages(includeText = false): Generator<PackageData, void, unknown> {
		for (const [key, packageInfo] of this.packages) {
			// Check cache first
			if (this.processedPackages.has(key)) {
				this.cacheHits++;
				this.totalRequests++;
				yield this.processedPackages.get(key)!;
				continue;
			}

			this.totalRequests++;
			const data = includeText ?
				packageInfo.toPackageDataWithText() :
				packageInfo.toPackageData();

			// Use object pooling for memory efficiency
			const pooledData = this.getPooledObject();
			Object.assign(pooledData, data);

			yield pooledData;

			// Return to pool after use
			this.returnToPool(pooledData);
		}
	}

	/**
	 * Process packages in batches for memory efficiency
	 */
	async *streamBatches(batchSize = 50, includeText = false): AsyncGenerator<PackageData[], void, unknown> {
		let batch: PackageData[] = [];

		for (const packageData of this.streamPackages(includeText)) {
			batch.push({ ...packageData }); // Clone to avoid pool conflicts

			if (batch.length >= batchSize) {
				yield batch;
				batch = [];

				// Allow garbage collection between batches
				if (global.gc) {
					global.gc();
				}
			}
		}

		if (batch.length > 0) {
			yield batch;
		}
	}

	/**
	 * Filter packages with streaming to reduce memory usage
	 */
	*streamFiltered(
		predicate: (data: PackageData) => boolean,
		includeText = false
	): Generator<PackageData, void, unknown> {
		for (const packageData of this.streamPackages(includeText)) {
			if (predicate(packageData)) {
				yield packageData;
			}
		}
	}

	/**
	 * Get pooled object to reduce allocations
	 */
	private getPooledObject(): PackageData {
		if (this.objectPool.length > 0) {
			const obj = this.objectPool.pop()!;
			// Clear all properties
			for (const key in obj) {
				delete obj[key as keyof PackageData];
			}
			return obj;
		}
		return {};
	}

	/**
	 * Return object to pool for reuse
	 */
	private returnToPool(obj: PackageData): void {
		if (this.objectPool.length < this.maxPoolSize) {
			this.objectPool.push(obj);
		}
	}

	/**
	 * Estimate object memory size
	 */
	private estimateObjectSize(obj: any): number {
		try {
			return JSON.stringify(obj).length * 2; // Rough estimate
		} catch {
			return 1000; // Fallback estimate
		}
	}

	/**
	 * Clean up memory - remove cached data and clear pools
	 */
	cleanup(): void {
		// Clear processed cache
		this.processedPackages.clear();

		// Clear object pool
		this.objectPool.length = 0;

		// Clear package instance caches
		for (const packageInfo of this.packages.values()) {
			packageInfo.clearCache();
		}

		this.memoryUsage = 0;
		this.cacheHits = 0;
		this.totalRequests = 0;
	}

	/**
	 * Get collection statistics
	 */
	getStats(): CollectionStats {
		return {
			totalPackages: this.packages.size,
			memoryUsage: this.memoryUsage,
			cacheHitRate: this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0,
			pooledObjects: this.objectPool.length
		};
	}

	/**
	 * Get all package data efficiently
	 */
	getAllPackages(includeText = false): PackageData[] {
		return Array.from(this.streamPackages(includeText));
	}

	/**
	 * Get package count without loading data
	 */
	get size(): number {
		return this.packages.size;
	}

	/**
	 * Check if package exists without loading data
	 */
	hasPackage(name: string, version: string): boolean {
		return this.packages.has(`${name}@${version}`);
	}

	/**
	 * Get memory usage information
	 */
	getMemoryInfo(): {
		estimatedSize: number;
		packageCount: number;
		cachedResults: number;
		poolSize: number;
	} {
		let totalMemory = 0;

		// Estimate memory usage
		for (const packageInfo of this.packages.values()) {
			const stats = packageInfo.getMemoryStats();
			totalMemory += stats.size;
		}

		return {
			estimatedSize: totalMemory + this.memoryUsage,
			packageCount: this.packages.size,
			cachedResults: this.processedPackages.size,
			poolSize: this.objectPool.length
		};
	}
}
