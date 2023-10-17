const inquirer = require('inquirer');
const mysql = require('mysql2/promise');
const QueryMaker = require('./lib/query.js')
require('dotenv').config();

let departments;
let roles;
let employees;

let db;

async function dbConnect() {
    db = await mysql.createConnection(
        {
            host: 'localhost',
            user: 'root',
            password: process.env.DB_PASSWORD,
            database: 'business_db'
        },
        console.info('Successfully connected to business_db database.\n')
    );
}

async function getData() {
    await db.query('SELECT * FROM department;').then((result) => departments = result[0]);
    await db.query('SELECT * FROM role;').then((result) => roles = result[0]);
    await db.query('SELECT * FROM employee;').then((result) => employees = result[0]);
}

const qm = new QueryMaker();

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
            let table = response.table.toLowerCase();
            if(command === 'View') {
                db.execute(qm.query(command, table), (err, result) => {
                    console.log(result);
                });
            }
            else {
                let { query, questions } = qm.query(command, table);

                inquirer
                    .prompt(questions)
                    .then((response) => {
                        console.log(query);
                        console.log(Object.keys(response).length);
                        console.log(`${query}${'?'.repeat(Object.keys(response).length)});`);
                        // db.execute(query, fields, (err, result) => {
                        //     console.log(result);
                        // });
                    });
            }
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
            name: 'command',
            message: 'Which action would you like to perform?',
            choices: commands
        }
    ];

    inquirer
        .prompt(question)
        .then((response) => {
            let { command } = response;
            command === 'Quit' ? process.exit() : inquireCommand(command);
        });
}

async function init() {
    await dbConnect();
    await getData();
    inquire();
}

init();
