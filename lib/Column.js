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

    printRow(index) {
        return this.rows[index];
    }
}

module.exports = Column;