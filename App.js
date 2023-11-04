const inquirer = require('inquirer');
const mysql = require('mysql2/promise');
const QueryMaker = require('./lib/QueryMaker.js');
const Table = require('./lib/Table.js');
require('dotenv').config();

let db;
let qm;

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

function catchError(err) {
    console.error(err);
}

function successMessage(command, plural) {
    console.info(`\nSuccessfully ${command} record${plural}.\n`);
}

async function viewRecords() {
    let choices = [
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
                .catch(catchError);
        })
}

async function addRecord() {
    let choices = [
        'Add department',
        'Add role',
        'Add employee'
    ];

    let question = {
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
                                .catch(catchError);
                            successMessage('added', '');
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
                                        .catch(catchError);
                                    successMessage('added', '');
                                });
                        })
                        .catch(catchError);
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
                                        employee_names.push(`${employee.name} (${employee.id})`);
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

                                            await db
                                                .execute(query, fields)
                                                .catch(catchError);
                                            successMessage('added', '');
                                        });
                                })
                                .catch(catchError);
                        })
                        .catch(catchError);
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
                employee_names.push(`${employee.name} (${employee.id})`);
            });

            let choices = [
                'Update role',
                'Update manager'
            ];

            let questions = [
                {
                    type: 'list',
                    name: 'employee_name',
                    message: 'Please choose which employee you wish to update:',
                    choices: employee_names
                },
                {
                    type: 'list',
                    name: 'command',
                    message: 'What would you like to update for this employee?',
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
                                                .catch(catchError);
                                            successMessage('updated', '');
                                        });
                                })
                                .catch(catchError);
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
                                        .catch(catchError);
                                    successMessage('updated', '')
                                });
                            break;
                    }
                });
        })
        .catch(catchError);
}

async function deleteRecord() {
    let choices = [
        'Delete a department',
        'Delete a role',
        'Delete an employee'
    ];

    let question = {
        type: 'list',
        name: 'command',
        message: 'From which table would you like to delete a record?',
        choices: choices
    };

    await inquirer
        .prompt(question)
        .then(async (response) => {
            switch(response.command) {
                case 'Delete a department':
                    await db
                        .query('SELECT id, name FROM department;')
                        .then(async (result) => {
                            if(result[0].length === 0) {
                                console.info('\nThere are no departments available to delete.\n');
                                return;
                            }

                            let department_ids = [];
                            let department_names = [];
                            result[0].forEach((department) => {
                                department_ids.push(department.id);
                                department_names.push(department.name);
                            });

                            let question = {
                                type: 'list',
                                name: 'department_name',
                                message: 'Please select which department you wish to delete:',
                                choices: department_names
                            };

                            await inquirer
                                .prompt(question)
                                .then(async (response) => {
                                    let department_id = department_ids[department_names.indexOf(response.department_name)];
                                    let { department_name } = response;

                                    await db
                                        .query(`SELECT ID, Title FROM role WHERE department_id = ${department_id};`)
                                        .then(async (result) => {
                                            if(result[0].length === 0) {
                                                await db
                                                    .query(qm.deleteRecord('department', department_id))
                                                    .catch(catchError);
                                                successMessage('deleted', '');
                                            }

                                            let role_ids = [];
                                            result[0].forEach((role) => role_ids.push(role.ID));

                                            let query = 'SELECT ID, CONCAT(first_name, " ", last_name) AS Name FROM employee WHERE role_id = ';
                                            let condition = `${role_ids[0]}`
                                            for(let i = 1; i < role_ids.length; i++) {
                                                condition += ` OR role_id = ${role_ids[i]}`;
                                            }
                                            query += condition + ';';

                                            let role_table = new Table();
                                            role_table.createTable(result);

                                            await db
                                                .query(query)
                                                .then(async (result) => {
                                                    if(result[0].length === 0) {
                                                        console.info(`\nBelow are the roles associated with the ${department_name} department.`);
                                                        role_table.printTable();

                                                        let question = {
                                                            type: 'confirm',
                                                            name: 'delete',
                                                            message: `Do you wish to delete BOTH the ${department_name} department and its associated roles above?`
                                                        };

                                                        await inquirer
                                                            .prompt(question)
                                                            .then(async (response) => {
                                                                if(response.delete) {
                                                                    await db
                                                                        .query(qm.deleteRecord('department', department_id))
                                                                        .catch(catchError);
                                                                    successMessage('deleted', 's');
                                                                }
                                                                else {
                                                                    console.info('\nCancelled deletion command.\n');
                                                                }
                                                            });
                                                    }
                                                    else {
                                                        let employee_table = new Table();
                                                        employee_table.createTable(result);

                                                        console.info(`\nBelow are the roles and employees associated with the ${department_name} department.`);
                                                        role_table.printTable();
                                                        employee_table.printTable();

                                                        let question = {
                                                            type: 'confirm',
                                                            name: 'delete',
                                                            message: `Do you wish to delete BOTH the ${department_name} department and its associated roles and employees above?`
                                                        };

                                                        await inquirer
                                                            .prompt(question)
                                                            .then(async (response) => {
                                                                if(response.delete) {
                                                                    await db
                                                                        .query(qm.deleteRecord('department', department_id))
                                                                        .catch(catchError);
                                                                    successMessage('deleted', 's');
                                                                }
                                                                else {
                                                                    console.info('\nCancelled deletion command.\n');
                                                                }
                                                            });
                                                    }
                                                })
                                                .catch(catchError)
                                        })
                                        .catch(catchError);
                                });
                        })
                        .catch(catchError);
                    break;
                case 'Delete a role':
                    await db
                        .query('SELECT id, title FROM role;')
                        .then(async (result) => {
                            if(result[0].length === 0) {
                                console.info('\nThere are no roles available to delete.\n');
                                return;
                            }

                            let role_ids = [];
                            let role_titles = [];
                            result[0].forEach((role) => {
                                role_ids.push(role.id);
                                role_titles.push(role.title);
                            });

                            let question = {
                                type: 'list',
                                name: 'role_title',
                                message: 'Please select which role you wish to delete:',
                                choices: role_titles
                            };

                            await inquirer
                                .prompt(question)
                                .then(async (response) => {
                                    let role_id = role_ids[role_titles.indexOf(response.role_title)];
                                    let { role_title } = response;
                                    await db
                                        .query(`SELECT ID, CONCAT(first_name, " ", last_name) AS Name FROM employee WHERE role_id = ${role_id};`)
                                        .then(async (result) => {
                                            if(result[0].length === 0) {
                                                await db
                                                    .query(qm.deleteRecord('role', role_id))
                                                    .catch(catchError);
                                                    successMessage('deleted', '');
                                            }
                                            else {
                                                console.info(`\nThe following employees are in the ${role_title} role you wish to delete.`);
                                                let table = new Table();
                                                table.createTable(result);
                                                table.printTable();

                                                let question = {
                                                    type: 'confirm',
                                                    name: 'delete',
                                                    message: `Do you wish to delete BOTH the ${role_title} role and its associated employees listed above?`
                                                };

                                                await inquirer
                                                    .prompt(question)
                                                    .then(async (response) => {
                                                        if(response.delete) {
                                                            await db
                                                                .query(qm.deleteRecord('role', role_id))
                                                                .catch(catchError);
                                                            successMessage('deleted', 's');
                                                        }
                                                        else {
                                                            console.info('\nCancelled deletion command.\n');
                                                        }
                                                    });
                                            }
                                        })
                                        .catch(catchError);
                                });
                        })
                        .catch(catchError);
                    break;
                case 'Delete an employee':
                    await db
                        .query('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee ORDER BY name;')
                        .then(async (result) => {
                            if(result[0].length === 0) {
                                console.info('\nThere are no employees available to delete.\n');
                                return;
                            }

                            let employee_ids = [];
                            let employee_names = [];
                            result[0].forEach((employee) => {
                                employee_ids.push(employee.id);
                                employee_names.push(`${employee.name} (${employee.id})`);
                            });

                            let question = {
                                type: 'list',
                                name: 'employee_name',
                                message: 'Please select which employee you wish to delete:',
                                choices: employee_names
                            };

                            await inquirer
                                .prompt(question)
                                .then(async (response) => {
                                    let employee_id = employee_ids[employee_names.indexOf(response.employee_name)];
                                    await db
                                        .query(qm.deleteRecord('employee', employee_id))
                                        .catch(catchError);
                                    successMessage('deleted', '');
                                });
                        })
                        .catch(catchError);
                    break;
            }
        });
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
                case 'Delete Record':
                    await deleteRecord();
                    break;
                case 'Quit':
                    console.info('\nHave a wonderful day!')
                    process.exit(0);
            }
        });
}

async function init() {
    console.info('\nWelcome to the Employee Tracker application!');
    console.info('Please follow the prompts to perform actions to manage your business.\n');

    qm = new QueryMaker(departments, roles, employees);

    while(true) {
        await inquire();
    }
}

init();
