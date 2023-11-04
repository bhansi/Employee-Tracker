class QueryMaker {
    validateRequired(input) {
        return input ? true : 'This field is required.';
    }

    validateSalary(input) {
        if(isNaN(input)) {
            return 'This field requires a number.';
        }
        else if(input <= 0 || input.length > 8) {
            return 'Invalid salary amount.';
        }
        else {
            return true;
        }
    }

    viewDepartments() {
        return 'SELECT Name, ID FROM department ORDER BY Name;';
    }

    viewRoles(where) {
        return 'SELECT ' +
            'role.title AS Title, ' +
            'role.id AS ID, ' +
            'department.name AS Department, ' +
            'CONCAT("$ ", FORMAT(role.salary, 2, "en_US")) AS Salary ' +
            'FROM role ' +
            `JOIN department ON role.department_id = department.id ${where} ` +
            'ORDER BY Title;';
    }

    viewEmployees(where) {
        return 'SELECT ' +
            'CONCAT(employee.first_name, " ", employee.last_name) AS Name, ' +
            'employee.id AS ID, ' +
            'role.title AS "Job Title", ' +
            'department.name AS Department, ' +
            'CONCAT("$ ", FORMAT(role.salary, 2, "en_US")) AS Salary, ' +
            '(SELECT CONCAT(manager.first_name, " ", manager.last_name) FROM employee AS manager WHERE employee.manager_id = manager.id) AS Manager ' +
            'FROM employee ' +
            'JOIN role ON employee.role_id = role.id ' +
            `JOIN department ON role.department_id = department.id ${where} ` +
            'ORDER BY Name;';
    }

    viewBudget(department_id) {
        return 'SELECT ' +
            'department.name AS Name, ' +
            'CONCAT("$ ", FORMAT(SUM(role.salary), 2, "en_US")) AS "Total Utilized Budget" ' +
            'FROM department ' +
            'JOIN role ON department.id = role.department_id ' +
            'JOIN employee ON role.id = employee.role_id ' +
            `WHERE department.id = ${department_id};`
    }

    addDepartment() {
        let question = {
            type: 'input',
            name: 'name',
            message: 'Please enter the department name:',
            validate: this.validateRequired
        };
        let query = 'INSERT INTO department (name) VALUES (?);';

        return { question, query };
    }

    addRole(departments) {
        let questions = [
            {
                type: 'input',
                name: 'title',
                message: 'Please enter the role title:',
                validate: this.validateRequired
            },
            {
                type: 'input',
                name: 'salary',
                message: 'Please enter the role salary:',
                validate: this.validateSalary
            },
            {
                type: 'list',
                name: 'department_name',
                message: 'Please select which department this role falls under:',
                choices: departments
            }
        ];
        let query = 'INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?);';

        return { questions, query };
    }

    addEmployee(roles, managers) {
        let questions = [
            {
                type: 'input',
                name: 'first_name',
                message: 'Please enter the employee\'s first name:',
                validate: this.validateRequired
            },
            {
                type: 'input',
                name: 'last_name',
                message: 'Please enter the employee\'s last name:',
                validate: this.validateRequired
            },
            {
                type: 'list',
                name: 'role_title',
                message: 'Please choose the employee\'s role:',
                choices: roles
            },
            {
                type: 'list',
                name: 'manager_name',
                message: 'Please select the employee\'s manager:',
                choices: managers
            }
        ];
        let query = 'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?);';

        return { questions, query };
    }

    updateEmployee(field, value, employee_id) {
        return `UPDATE employee SET ${field} = ${value} WHERE id = ${employee_id};`;
    }

    deleteRecord(table, id) {
        return `DELETE FROM ${table} WHERE id = ${id};`;
    }
}

module.exports = QueryMaker
