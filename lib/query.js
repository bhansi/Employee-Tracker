class QueryMaker {
    view(table) {
        return `SELECT * FROM ${table};`;
    }

    add(table) {
        let query;
        let fields;
        let questions;
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
                        type: 'input',
                        name: 'department',
                        message: 'Please enter which department this role falls under:',
                        validate: validateRequired
                    }
                ];
                break;
            case 'employee':
                break;
        }

        query = `INSERT INTO ${table} VALUES(`;
        
        return { query, questions };
    }

    query(command, table) {
        return command === 'View'   ? this.view(table)   :
               command === 'Add'    ? this.add(table)    :
               command === 'Update' ? this.update(table) :
                                      this.delete(table) ;
    }
}

module.exports = QueryMaker
