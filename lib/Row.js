class Row {
    constructor(value) {
        this.value = value;
    }

    getWidth() {
        return this.value === null ? 4 : this.value.length;
    }
}

module.exports = Row;