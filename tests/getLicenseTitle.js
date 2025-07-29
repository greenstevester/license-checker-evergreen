import { describe, test, expect } from '@jest/globals';
import { getLicenseTitle } from '../dist/lib/getLicenseTitle.js';

describe('license parser', () => {
    test('should export a function', () => {
        expect(typeof getLicenseTitle).toBe('function');
    });

    test('should throw an error when called with a non-string argument', (done) => {
        try {
            getLicenseTitle({});
        } catch (err) {
            expect(err instanceof Error).toBe(true);
            done();
        }
    });

    test('removes newlines from the argument', () => {
        expect(getLicenseTitle('unde\nfined')).toBe('Undefined');
    });

    test('undefined check', () => {
        expect(getLicenseTitle(undefined)).toBe('Undefined');
    });

    test('MIT check', () => {
        const data = getLicenseTitle('asdf\nasdf\nasdf\nPermission is hereby granted, free of charge, to any');
        expect(data).toBe('MIT*');
    });

    test('MIT word check', () => {
        const data = getLicenseTitle('asdf\nasdf\nMIT\nasdf\n');
        expect(data).toBe('MIT*');
    });

    test('Non-MIT word check', () => {
        const data = getLicenseTitle('prefixMIT\n');
        expect(data).not.toBe('MIT*');
    });

    test('GPL word check', () => {
        let data;
        data = getLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 1, February 1989');
        expect(data).toBe('GPL-1.0*');
        data = getLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 2, June 1991');
        expect(data).toBe('GPL-2.0*');
        data = getLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007');
        expect(data).toBe('GPL-3.0*');
    });

    test('Non-GPL word check', () => {
        let data;
        data = getLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 1, February 1989');
        expect(data).not.toBe('GPL-1.0*');
        data = getLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 2, June 1991');
        expect(data).not.toBe('GPL-2.0*');
        data = getLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007');
        expect(data).not.toBe('GPL-3.0*');
    });

    test('LGPL word check', () => {
        let data;
        data = getLicenseTitle('GNU LIBRARY GENERAL PUBLIC LICENSE\nVersion 2, June 1991');
        expect(data).toBe('LGPL-2.0*');
        data = getLicenseTitle('GNU LESSER GENERAL PUBLIC LICENSE\nVersion 2.1, February 1999');
        expect(data).toBe('LGPL-2.1*');
        data = getLicenseTitle('GNU LESSER GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007');
        expect(data).toBe('LGPL-3.0*');
    });

    test('BSD check', () => {
        const data = getLicenseTitle(
            'asdf\nRedistribution and use in source and binary forms, with or without\nasdf\n',
        );
        expect(data).toBe('BSD*');
    });

    test('BSD-Source-Code check', () => {
        const data = getLicenseTitle(
            'asdf\nRedistribution and use of this software in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\nasdf\n',
        );
        expect(data).toBe('BSD-Source-Code*');
    });

    test('BSD word check', () => {
        const data = getLicenseTitle('asdf\nasdf\nBSD\nasdf\n');
        expect(data).toBe('BSD*');
    });

    test('Non-BSD word check', () => {
        const data = getLicenseTitle('prefixBSD\n');
        expect(data).not.toBe('BSD*');
    });

    test('Apache version check', () => {
        const data = getLicenseTitle('asdf\nasdf\nApache License Version 2\nasdf\n');
        expect(data).toBe('Apache-2.0*');
    });

    test('Apache word check', () => {
        const data = getLicenseTitle('asdf\nasdf\nApache License\nasdf\n');
        expect(data).toBe('Apache*');
    });

    test('Non-Apache word check', () => {
        const data = getLicenseTitle('prefixApache License\n');
        expect(data).not.toBe('Apache*');
    });

    test('WTF check', () => {
        const data = getLicenseTitle('DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE');
        expect(data).toBe('WTFPL*');
    });

    test('WTF word check', () => {
        const data = getLicenseTitle('asdf\nasdf\nWTFPL\nasdf\n');
        expect(data).toBe('WTFPL*');
    });

    test('Non-WTF word check', () => {
        const data = getLicenseTitle('prefixWTFPL\n');
        expect(data).not.toBe('WTFPL*');
    });

    test('ISC check', () => {
        const data = getLicenseTitle('asdfasdf\nThe ISC License\nasdfasdf');
        expect(data).toBe('ISC*');
    });

    test('Non-ISC word check', () => {
        const data = getLicenseTitle('prefixISC\n');
        expect(data).not.toBe('ISC*');
    });

    test('ISC word check', () => {
        const data = getLicenseTitle('asdf\nasdf\nISC\nasdf\n');
        expect(data).toBe('ISC*');
    });

    test('CC0-1.0 word check', () => {
        const data = getLicenseTitle(
            'The person who associated a work with this deed has dedicated the work to the public domain by waiving all of his or her rights to the work worldwide under copyright law, including all related and neighboring rights, to the extent allowed by law.\n\nYou can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.\n',
        );
        expect(data).toBe('CC0-1.0*');
    });

    test('Public Domain check', () => {
        let data = getLicenseTitle('Public Domain');
        expect(data).toBe('Public Domain');
        data = getLicenseTitle('public domain');
        expect(data).toBe('Public Domain');
        data = getLicenseTitle('Public domain');
        expect(data).toBe('Public Domain');
        data = getLicenseTitle('Public-Domain');
        expect(data).toBe('Public Domain');
        data = getLicenseTitle('Public_Domain');
        expect(data).toBe('Public Domain');
    });

    test('License at URL check', () => {
        let data = getLicenseTitle('License: http://example.com/foo');
        expect(data).toBe('Custom: http://example.com/foo');
        data = getLicenseTitle('See license at http://example.com/foo');
        expect(data).toBe('Custom: http://example.com/foo');
        data = getLicenseTitle('license: https://example.com/foo');
        expect(data).toBe('Custom: https://example.com/foo');
    });

    test('Likely not a license at URL check', () => {
        let data = getLicenseTitle('http://example.com/foo');
        expect(data).toBe(null);
        data = getLicenseTitle('See at http://example.com/foo');
        expect(data).toBe(null);
    });

    test('License at file check', () => {
        let data = getLicenseTitle('See license in LICENSE.md');
        expect(data).toBe('Custom: LICENSE.md');
        data = getLicenseTitle('SEE LICENSE IN LICENSE.md');
        expect(data).toBe('Custom: LICENSE.md');
    });

    test('Check for null', () => {
        const data = getLicenseTitle('this is empty, hi');
        expect(data).toBe(null);
    });

    describe('SPDX licenses', () => {
        test('should parse a basic SPDX license', () => {
            const data = ['MIT', 'LGPL-2.0', 'Apache-2.0', 'BSD-2-Clause'];
            data.forEach((licenseType) => {
                expect(getLicenseTitle(licenseType)).toBe(licenseType);
            });
        });

        test('should parse more complicated license expressions', () => {
            const data = [
                '(GPL-2.0+ WITH Bison-exception-2.2)',
                'LGPL-2.0 OR (ISC AND BSD-3-Clause+)',
                'Apache-2.0 OR ISC OR MIT',
            ];
            data.forEach((licenseType) => {
                expect(getLicenseTitle(licenseType)).toBe(licenseType);
            });
        });
    });
});
