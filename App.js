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

    const question = {
        type: 'list',
        name: 'view',
        message: 'Please select a view:',
        choices: choices
    };

    await inquirer
        .prompt(question)
        .then(async (response) => {
            let query;

            switch(response.view) {
                case 'View all departments':
                    query = qm.viewDepartments();
                    break;
                case 'View all roles':
                    query = qm.viewRoles();
                    break;
                case 'View all employees':
                    query = qm.viewEmployees();
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

            await db
                .execute(query)
                .then((result) => {
                    let table = new Table();
                    table.createTable(result);
                    table.printTable();
                })
                .catch((err) => console.error(err));
        })
}

async function addRecord() {
    const choices = [
        'Add department',
        'Add role',
        'Add employee'
    ];

    const question = {
        type: 'list',
        name: 'command',
        message: 'What would you like to add?',
        choices: choices
    };

    await inquirer
        .prompt(question)
        .then(async (response) => {
            switch(response.command) {
                case 'Add department':
                    let { question, query } = qm.addDepartment();

                    await inquirer
                        .prompt(question)
                        .then(async (response) => {
                            await db
                                .execute(query, [ response.name ])
                                .then((result) => {
                                    console.log(result);
                                })
                                .catch((err) => console.error(err));
                        });
                    break;
                case 'Add role':
                    await db
                        .query('SELECT * FROM department;')
                        .then(async (result) => {
                            if(result[0].length === 0) {
                                console.info('\nPlease add a department before adding roles.\n');
                                return;
                            }

                            let department_ids = [];
                            let department_names = [];
                            result[0].forEach((department) => {
                                department_ids.push(department.id);
                                department_names.push(department.name);
                            });

                            let { questions, query } = qm.addRole(department_names);

                            await inquirer
                                .prompt(questions)
                                .then(async (response) => {
                                    let fields = [
                                        response.title,
                                        response.salary,
                                        department_ids[department_names.indexOf(response.department_name)]
                                    ];

                                    await db
                                        .execute(query, fields)
                                        .then((result) => {
                                            console.log(result);
                                        })
                                        .catch((err) => console.error(err));
                                });
                        })
                        .catch((err) => console.error(err));
                    break;
                case 'Add employee':
                    await db
                        .query('SELECT id, title FROM role;')
                        .then(async (result) => {
                            if(result[0].length === 0) {
                                console.info('\nPlease add a role before adding employees.\n');
                                return;
                            }

                            let role_ids = [];
                            let role_titles = [];
                            result[0].forEach((role) => {
                                role_ids.push(role.id);
                                role_titles.push(role.title);
                            });

                            await db
                                .query('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee;')
                                .then(async (result) => {
                                    let employee_ids = [ null ];
                                    let employee_names = [ 'No manager' ];
                                    result[0].forEach((employee) => {
                                        employee_ids.push(employee.id);
                                        employee_names.push(employee.name);
                                    });

                                    let { questions, query } = qm.addEmployee(role_titles, employee_names);

                                    await inquirer
                                        .prompt(questions)
                                        .then(async (response) => {
                                            let fields = [
                                                response.first_name,
                                                response.last_name,
                                                role_ids[role_titles.indexOf(response.role_title)],
                                                employee_ids[employee_names.indexOf(response.manager_name)]
                                            ];

                                            await db.execute(query, fields)
                                            .then((result) => {
                                                console.log(result);
                                            })
                                            .catch((err) => console.error(err));
                                        });
                                })
                                .catch((err) => console.error(err));
                        })
                        .catch((err) => console.error(err));
                    break;
            }
        });
}

async function updateRecord() {
    await db
        .query('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee ORDER BY name;')
        .then(async (result) => {
            if(result[0].length === 0) {
                console.info('\nSorry, there are no employees available to update.\n');
                return;
            }

            let employee_ids = [];
            let employee_names = [];
            result[0].forEach((employee) => {
                employee_ids.push(employee.id);
                employee_names.push(employee.name);
            });

            const choices = [
                'Update role',
                'Update manager'
            ];

            const questions = [
                {
                    type: 'list',
                    name: 'employee_name',
                    message: 'Please choose which employee you wish to update:',
                    choices: employee_names
                },
                {
                    type: 'list',
                    name: 'command',
                    message: 'What would you like to update?',
                    choices: choices
                }
            ];

            await inquirer
                .prompt(questions)
                .then(async (response) => {
                    let { employee_name, command } = response;
                    let employee_id = employee_ids[employee_names.indexOf(employee_name)];

                    switch(command) {
                        case 'Update role':
                            await db
                                .query('SELECT id, title FROM role;')
                                .then(async (result) => {
                                    let role_ids = [];
                                    let role_titles = [];
                                    result[0].forEach((role) => {
                                        role_ids.push(role.id);
                                        role_titles.push(role.title);
                                    });

                                    let question = {
                                        type: 'list',
                                        name: 'role_title',
                                        message: `Please select the updated role for ${employee_name}:`,
                                        choices: role_titles
                                    };

                                    await inquirer
                                        .prompt(question)
                                        .then(async (response) => {
                                            let role_id = role_ids[role_titles.indexOf(response.role_title)];

                                            await db
                                                .query(qm.updateEmployee('role_id', role_id, employee_id))
                                                .then((result) => {
                                                    console.log(result);
                                                })
                                                .catch((err) => console.error(err));
                                        });
                                })
                                .catch((err) => console.error(err));
                            break;
                        case 'Update manager':
                            employee_ids = employee_ids.filter((id) => id !== employee_id);
                            employee_names = employee_names.filter((name) => name !== employee_name);
                            employee_ids.splice(0, 0, null);
                            employee_names.splice(0, 0, 'No manager');

                            let question = {
                                type: 'list',
                                name: 'manager_name',
                                message: `Please select the updated manager for ${employee_name}:`,
                                choices: employee_names
                            };

                            await inquirer
                                .prompt(question)
                                .then(async (response) => {
                                    let manager_id = employee_ids[employee_names.indexOf(response.manager_name)];

                                    await db
                                        .query(qm.updateEmployee('manager_id', manager_id, employee_id))
                                        .then((result) => {
                                            console.log(result)
                                        })
                                        .catch((err) => console.error(err));
                                });
                            break;
                    }
                });
        })
        .catch((err) => console.error(err));
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
            switch(command) {
                case 'View Records':
                    await viewRecords();
                    break;
                case 'Add Record':
                    await addRecord();
                    break;
                case 'Update Record':
                    await updateRecord();
                    break;
            }
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
