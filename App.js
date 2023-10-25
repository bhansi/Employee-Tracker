const inquirer = require('inquirer');
const mysql = require('mysql2/promise');
const QueryMaker = require('./lib/QueryMaker.js');
const Table = require('./lib/Table.js');
require('dotenv').config();

let departments;
let roles;
let employees;

let db;
let qm;

let command_finished = false;

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

function getDepartmentId(name) {
    for(let department of departments) {
        if(department.name === name)
            return department.id;
    }
}

function getRoleId(title) {
    for(let role of roles) {
        if(role.title === title)
            return role.id;
    }
}

function getEmployeeId(name) {
    for(let employee of employees) {
        if(`${employee.first_name} ${employee.last_name}` === name)
            return employee.id;
    }
    return null;
}

function nameToId(fields, response) {
    if(fields.includes('department_id')) {
        response['department_id'] = getDepartmentId(response['department_id']);
    }
    if(fields.includes('role_id')) {
        response['role_id'] = getRoleId(response['role_id']);
    }
    if(fields.includes('manager_id')) {
        response['manager_id'] = getEmployeeId(response['manager_id']);
    }
}

async function inquireCommand(command) {
    let message = `${command.split(' ')[0]} ${command.split(' ')[1].toLowerCase()}`;
    command = command.split(' ')[0];

    let tables = [
        'Department',
        'Role',
        'Employee'
    ];

    switch(command) {
        case 'View':
            message += ' from:';
            break;
        case 'Update':
        case 'Delete':
            message += ' from:';
            if(!roles.length) { tables.pop(); }
            if(!departments.length) { tables.pop(); }
            break;
        case 'Add':
            message += ' to:';
            if(!roles.length) { tables.pop(); }
            if(!departments.length) { tables.pop(); }
            break;
    }

    let question = {
        type: 'list',
        name: 'table',
        message: message,
        choices: tables
    }

    await inquirer
        .prompt(question)
        .then(async (response) => {
            let table = response.table.toLowerCase();
            if(command === 'View') {
                await db.execute(qm.query(command, table)).then((result) => {
                    console.log(result);
                });
            }
            else {
                let { query, questions, fields } = qm.query(command, table);

                await inquirer
                    .prompt(questions)
                    .then(async (response) => {
                        nameToId(fields, response);
                        fields = fields.map((field) => response[field]);
                        await db.execute(query, fields).then((result) => console.log(result));
                        await getData();
                        qm = new QueryMaker(departments, roles, employees);
                    });
            }
        });
}

async function viewRecords() {
    const choices = [
        'View all departments',
        'View all roles',
        'View all employees',
        'View roles by department',
        'View employees by role',
        'View employees by manager'
    ];

    let question = {
        type: 'list',
        name: 'view',
        message: 'Please select a view:',
        choices: choices
    };

    await inquirer
        .prompt(question)
        .then(async (response) => {
            let { view } = response;
            let query;
            switch(view) {
                case 'View all departments':
                    query = qm.viewAll('department');
                    break;
                case 'View all roles':
                    query = qm.viewAll('role');
                    break;
                case 'View all employees':
                    query = qm.viewAll('employee');
                    break;
                case 'View roles by department':
                    query = qm.viewBy('role', 'department_id');
                    break;
                case 'View employees by role':
                    query = qm.viewBy('employee', 'role_id');
                    break;
                case 'View employees by manager':
                    query = qm.viewBy('employee', 'manager_id');
                    break;
            }
            await db.execute(query).then((result) => {
                let table = new Table();
                table.createTable(result);
                table.printTable();
            });
        })
}

async function inquire() {
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

    await inquirer
        .prompt(question)
        .then(async (response) => {
            let { command } = response;
            // command === 'Quit' ? process.exit() : await inquireCommand(command);
            if(command === 'View Records')
                await viewRecords();
        });
}

async function init() {
    await dbConnect();
    await getData();
    qm = new QueryMaker(departments, roles, employees);
    while(true) {
        await inquire();
    }
}

init();
