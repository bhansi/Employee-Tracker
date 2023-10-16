const inquirer = require('inquirer');

class QueryMaker {
    view(table) {
        return `SELECT * FROM ${table};`;
    }

    add(table) {
        let questions = [];

        switch(table) {
            case 'department':
                break;
            case 'role':
                break;
            case 'employee':
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
