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

licenseCheckerMain.init(parsedArgs, async function (err: Error | null, foundLicensesJson: Record<string, unknown>) {
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
