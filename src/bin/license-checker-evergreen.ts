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
const hasFailingArg = parsedArgs.failOn || parsedArgs.onlyAllow;
const knownOptions = Object.keys(args.knownOptions);
const unknownArgs = Object.keys(parsedArgs).filter((arg) => !knownOptions.includes(arg));

exitProcessOrWarnIfNeeded({ unknownArgs, parsedArgs });

// Choose the appropriate initialization function based on optimization level
const initFunction = parsedArgs.memoryOptimized
    ? licenseCheckerMain.initMemoryOptimized
    : licenseCheckerMain.init;

initFunction(parsedArgs, async function (err: Error | null, foundLicensesJson: Record<string, unknown>) {
	if (err) {
		console.error('An error has occurred:');
		console.error(err);
	}

	if (!parsedArgs.out) {
		if (helpers.shouldColorizeOutput(parsedArgs)) {
			helpers.colorizeOutput(foundLicensesJson);
		}

		const formattedOutput = await helpers.getFormattedOutput(foundLicensesJson, parsedArgs);
		console.log(formattedOutput);
	}
});
