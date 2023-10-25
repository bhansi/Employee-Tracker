const Column = require('./Column.js');
const Row = require('./Row.js');

class Table {
    constructor() {
        this.number_of_columns;
        this.number_of_rows;
        this.table_width = 0;
        this.columns = [];
    }

    calculateTableWidth() {
        this.columns.forEach((column) => this.table_width += column.max_width);
        this.table_width += this.number_of_columns * 2 + this.number_of_columns + 1; // Horizontal padding
    }

    addColumn(name) {
        this.columns.push(new Column(name));
    }

    addRow(column_id, value) {
        let column = this.columns[column_id];
        let row = new Row(value);
        column.updateMaxWidth(row.getWidth());
        column.addRow(new Row(value));
    }

    createTable(table_data) {
        let data = table_data[0];
        let meta_data = table_data[1];

        this.number_of_columns = meta_data.length;
        this.number_of_rows = data.length;

        for(let col = 0; col < this.number_of_columns; col++) {
            this.addColumn(meta_data[col].name);
            for(let row = 0; row < this.number_of_rows; row++) {
                let value = data[row][meta_data[col].name];
                this.addRow(col, value);
            }
        }
        this.calculateTableWidth();
    }

    printTable() {
        // Print column names
        console.info(`${'-'.repeat(this.table_width)}`);
        let print_line = '|';
        this.columns.forEach((column) => print_line += ` ${column.name + ' '.repeat(column.max_width - column.name.length)} |`);
        console.info(print_line);
        console.info(`${'-'.repeat(this.table_width)}`);

        // Print rows
        for(let row = 0; row < this.number_of_rows; row++) {
            print_line = '|';
            this.columns.forEach((column) => {
                print_line += ` ${column.printRow(row) + ' '.repeat(column.max_width - column.getRowValueWidth(row))} |`;
            });
            console.info(print_line);
        }

        // Print bottom of table
        console.info(`${'-'.repeat(this.table_width)}`);
    }
}

module.exports = Table;