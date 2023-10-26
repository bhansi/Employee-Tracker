class Column {
    constructor(name) {
        this.name = name;
        this.max_width = name.length;
        this.rows = [];
    }

    updateMaxWidth(width) {
        if(width > this.max_width)
            this.max_width = width;
    }

    addRow(row) {
        this.rows.push(row);
    }

    getRowValueWidth(index) {
        return this.rows[index].getWidth();
    }

    insertNamePadding() {
        return ' '.repeat(this.max_width - this.name.length);
    }

    printColumnName() {
        return ` ${this.name}${this.insertNamePadding()} |`;
    }

    insertRowPadding(index) {
        return ' '.repeat(this.max_width - this.getRowValueWidth(index));
    }

    printRow(index) {
        return ` ${this.rows[index].value}${this.insertRowPadding(index)} |`;
    }
}

module.exports = Column;