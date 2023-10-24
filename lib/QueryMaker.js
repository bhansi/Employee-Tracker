class QueryMaker {
    constructor(departments, roles, employees) {
        this.departments = departments;
        this.roles = roles;
        this.employees = employees;
        this.department_names = [];

        this.department_names = departments.map((department) => department.name);
        this.role_titles = roles.map((role) => role.title);
        this.employee_names = employees.map((employee) => `${employee.first_name} ${employee.last_name}`);
        this.employee_names.splice(0, 0, 'No Manager');
    }

    validateRequired(input) {
        return input ? true : 'This field is required.';
    }

    validateSalary(input) {
        return !isNaN(Number.parseFloat(input)) ? true : 'This field requires a number.';
    }

    displayTable(result) {
        let number_of_columns = result[1].length;
        return number_of_columns;
    }

    viewAll(table) {
        return `SELECT * FROM ${table};`;
    }

    viewBy(table, order) {
        return `SELECT * FROM ${table} ORDER BY ${order};`;
    }

    add(table) {
        let query = `INSERT INTO ${table} (`;
        let questions;
        let fields;

        switch(table) {
            case 'department':
                questions = {
                    type: 'input',
                    name: 'name',
                    message: 'Please enter the department name:',
                    validate: this.validateRequired
                };
                fields = ["name"];
                break;
            case 'role':
                questions = [
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
                        name: 'department_id',
                        message: 'Please select which department this role falls under:',
                        choices: this.department_names
                    }
                ];
                fields = ['title', 'salary', 'department_id'];
                break;
            case 'employee':
                questions = [
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
                        name: 'role_id',
                        message: 'Please choose the employee\'s role:',
                        choices: this.role_titles
                    },
                    {
                        type: 'list',
                        name: 'manager_id',
                        message: 'Please select the employee\'s manager:',
                        choices: this.employee_names
                    }
                ];
                fields = ['first_name', 'last_name', 'role_id', 'manager_id'];
                break;
        }

        fields.forEach((field) => query += `${field}, `);
        query = query.slice(0, query.length - 2) + ') VALUES (';
        query += '?, '.repeat(fields.length - 1) + '?);';

        // return fields ? { query, questions, fields } : { query, questions };
        return { query, questions, fields };
    }

    update(table) {
        let query = `UPDATE ${table} SET `;
        let questions;
        let fields;

        switch(table) {
            case 'department':
                questions = [
                    {
                        type: 'list',
                        name: 'id',
                        message: 'Please select the department you would like to update:',
                        choices: this.department_names
                    },
                    {
                        type: 'input',
                        name: 'name',
                        message: 'Please enter the updated department name:',
                        validate: this.validateRequired
                    }
                ];
                fields = ['id', 'name'];
                break;
            case 'role':
                questions = [
                    {
                        type: 'list',
                        name: 'id',
                        message: 'Please select which role you would like to update:',
                        choices: this.role_titles
                    },
                    {
                        type: 'input',
                        name: 'title',
                        message: 'Please enter the updated role title (enter n/a to keep the same):',
                        validate: this.validateRequired
                    },
                    {
                        type: 'input',
                        name: 'salary',
                        message: 'Please enter the upated role salary (enter n/a to keep the same):',
                        validate: this.validateSalary
                    },
                    {
                        type: 'list',
                        name: 'department_id',
                        message: 'Please select which department this role falls under:',
                        choices: this.department_names
                    }
                ];
                fields = ['title', 'salary', 'department_id'];
                break;
        }
    }

    query(command, table) {
        return command === 'View'   ? this.view(table)   :
               command === 'Add'    ? this.add(table)    :
               command === 'Update' ? this.update(table) :
                                      this.delete(table) ;
    }
}

module.exports = QueryMaker
