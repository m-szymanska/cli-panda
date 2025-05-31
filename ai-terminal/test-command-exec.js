#!/usr/bin/env node

// Simple test for command execution feature
const { spawn } = require('child_process');

// Simple color functions (chalk v5 is ESM only)
const colors = {
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`
};

// Test the command execution logic
function executeCommand(command) {
    console.log(colors.cyan(`🤖 Executing: ${command}`));
    
    const parts = command.trim().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    const childProcess = spawn(cmd, args, {
        cwd: process.cwd(),
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    childProcess.stdout.on('data', (data) => {
        process.stdout.write(data.toString());
    });

    childProcess.stderr.on('data', (data) => {
        process.stderr.write(colors.red(data.toString()));
    });

    childProcess.on('close', (code) => {
        if (code === 0) {
            console.log(colors.green(`✅ Command completed successfully`));
        } else {
            console.log(colors.red(`❌ Command failed with exit code ${code}`));
        }
    });

    childProcess.on('error', (error) => {
        console.log(colors.red(`❌ Error executing command: ${error.message}`));
    });
}

// Test commands
console.log(colors.blue('Testing command execution feature...\n'));

// Test 1: Simple ls command
console.log(colors.yellow('Test 1: ls command'));
executeCommand('ls -la');

setTimeout(() => {
    console.log(colors.yellow('\nTest 2: echo command'));
    executeCommand('echo "Hello from AI Terminal!"');
}, 1000);

setTimeout(() => {
    console.log(colors.yellow('\nTest 3: pwd command'));
    executeCommand('pwd');
}, 2000);