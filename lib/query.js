const inquirer = require('inquirer');

class QueryMaker {
    view(table) {
        return `SELECT * FROM ${table};`;
    }

    add(table) {
        let questions = [
            {
                type: 
            }
        ];
    }

    query(command, table) {
        return command === 'View'   ? this.view(table)   :
               command === 'Add'    ? this.add(table)    :
               command === 'Update' ? this.update(table) :
                                      this.delete(table) ;
    }
}

modules.export = QueryMaker
