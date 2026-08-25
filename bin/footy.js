#!/usr/bin/env node

import dotenv from 'dotenv';
import { createCli } from '../src/cli.js';

// Load environment variables if available (.env)
dotenv.config();

const program = createCli();
await program.parseAsync(process.argv);

