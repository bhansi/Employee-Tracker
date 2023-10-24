class Column {
    constructor(name) {
        this.name = name;
        this.max_width = name.length;
    }

    updateMaxWidth(width) {
        if(width > this.max_width)
            this.max_width = width;
    }
}