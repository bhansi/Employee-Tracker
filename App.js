const inquirer = require('inquirer');
const mysql = require('mysql2');
const QueryMaker = require('./lib/query.js')
require('dotenv').config();

const db = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: process.env.DATABASE_PASSWORD,
        database: 'business_db'
    },
    console.info('Successfully connected to business_db database.\n')
);

function inquireCommand(command) {
    let message = `${command.split(' ')[0]} ${command.split(' ')[1].toLowerCase()}`;
    command = command.split(' ')[0];

    switch(command) {
        case 'View':
        case 'Update':
        case 'Delete':
            message += ' from:';
            break;
        case 'Add':
            message += ' to:';
            break;
    }

    const tables = [
        'Department',
        'Role',
        'Employee'
    ];

    let question = {
        type: 'list',
        name: 'table',
        message: message,
        choices: tables
    }

    inquirer
        .prompt(question)
        .then((response) => {
            let { table } = response;
            console.log(response);
            db.execute()
        });
}

function inquire() {
    const commands = [
        'View Records',
        'Add Record',
        'Update Record',
        'Delete Record',
        'Quit'
    ];

    const question = [
        {
            type: 'list',
            name: 'command_type',
            message: 'Which action would you like to perform?',
            choices: commands
        }
    ];

    inquirer
        .prompt(question)
        .then((response) => {
            let { command } = response;
            commands === 'Quit' ? process.exit() : inquireCommand(command);
        });
}

function init() {
    inquire();
}

init();
