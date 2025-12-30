#!/usr/bin/env node

/*
Copyright (c) 2013, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://yuilibrary.com/license/
*/

import * as args from '../lib/args.js';
import { exitProcessOrWarnIfNeeded } from '../lib/exitProcessOrWarnIfNeeded.js';
import * as helpers from '../lib/licenseCheckerHelpers.js';
import * as licenseCheckerMain from '../lib/index.js';

const parsedArgs = args.parse();
const knownOptions = Object.keys(args.knownOptions);
// 'direct' is an internal property set by setDefaultArguments (stores normalized depth value)
const internalProperties = ['direct'];
const unknownArgs = Object.keys(parsedArgs).filter(
	(arg) => !knownOptions.includes(arg) && !internalProperties.includes(arg),
);

exitProcessOrWarnIfNeeded({ unknownArgs, parsedArgs });

// Result handler for both fast and legacy modes
const handleResult = async function (err: Error | null, foundLicensesJson: Record<string, unknown>) {
	if (err) {
		console.error('An error has occurred:');
		console.error(err);
		process.exit(1);
	}

	if (!parsedArgs.out) {
		if (helpers.shouldColorizeOutput(parsedArgs)) {
			helpers.colorizeOutput(foundLicensesJson);
		}

		const formattedOutput = await helpers.getFormattedOutput(foundLicensesJson, parsedArgs);
		console.log(formattedOutput);
	}
};

// Use fast mode by default, legacy mode with --legacy flag
if (parsedArgs.legacy) {
	// Legacy mode using read-installed (slower but more compatible)
	licenseCheckerMain.init(parsedArgs, handleResult);
} else {
	// Fast mode using parallel package scanner (8-12x faster)
	licenseCheckerMain.initFast(parsedArgs, handleResult);
}
