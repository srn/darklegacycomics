#!/usr/bin/env node
'use strict';

const darklegacycomics = require('./index-compiled');
const updateNotifier = require('update-notifier');
const meow = require('meow');

const cli = meow(`
	Usage
	  $ darklegacycomics <path>
`);

updateNotifier({pkg: cli.pkg}).notify();

darklegacycomics(cli.input[0]);
