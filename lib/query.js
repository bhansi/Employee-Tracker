class QueryMaker {
    constructor(departments, roles, employees) {
        this.departments = departments;
        this.roles = roles;
        this.employees = employees;
        this.department_names = [];
        if(typeof departments === Object) {
            this.department_names.push(departments.name);
        }
        else {
            this.department_names = departments.map((department) => department.name);
        }
    }

    view(table) {
        return `SELECT * FROM ${table};`;
    }

    add(table) {
        let query = `INSERT INTO ${table} (`;
        let questions;
        let fields;
        let validateRequired = (input) => input ? true : 'This field is required.';
        let validateSalary = (input) => !isNaN(Number.parseFloat(input)) ? true : 'This field requires a number.'

        switch(table) {
            case 'department':
                questions = {
                    type: 'input',
                    name: 'name',
                    message: 'Please enter the department name:',
                    validate: validateRequired
                };
                fields = ["name"];
                break;
            case 'role':
                questions = [
                    {
                        type: 'input',
                        name: 'title',
                        message: 'Please enter the role title:',
                        validate: validateRequired
                    },
                    {
                        type: 'input',
                        name: 'salary',
                        message: 'Please enter the role salary:',
                        validate: validateSalary
                    },
                    {
                        type: 'list',
                        name: 'department_id',
                        message: 'Please enter which department this role falls under:',
                        choices: this.department_names
                    }
                ];
                fields = ['title', 'salary', 'department_id'];
                break;
            case 'employee':
                break;
        }

        fields.forEach((field) => query += `${field}, `);
        query = query.slice(0, query.length - 2) + ') VALUES (';
        query += '?, '.repeat(fields.length - 1) + '?);';

        return fields ? { query, questions, fields } : { query, questions };
    }

    query(command, table) {
        return command === 'View'   ? this.view(table)   :
               command === 'Add'    ? this.add(table)    :
               command === 'Update' ? this.update(table) :
                                      this.delete(table) ;
    }
}

module.exports = QueryMaker
