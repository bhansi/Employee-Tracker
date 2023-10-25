class Row {
    constructor(value) {
        this.value = value;
    }

    getWidth() {
        if(this.value === null)
            return 4;
        else if(typeof this.value === 'number')
            return this.value.toString().length;
        else
            return this.value.length;
    }
}

module.exports = Row;