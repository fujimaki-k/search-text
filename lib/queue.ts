/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';


class Queue {
    public length: number;
    private index: number;
    private values: Array<any> = [];

    constructor() {
        this.initialize();
    }

    private initialize() {
        this.length = 0;
        this.index = 0;
        this.values.length = 0;
    }

    public push(value: any) {
        this.values.push(value);
        this.length = this.length + 1;

        return this;
    }

    public pop() {
        const result = this.values.pop();
        this.length = this.length - 1;
        if (this.length < 1) {
            this.initialize();
        }

        return result;
    }

    public shift() {
        const result = this.values[this.index];
        this.index = this.index + 1;
        this.length = this.length - 1;
        if (this.length < 1) {
            this.initialize();
        }

        return result;
    }
}


// Export module
export default Queue;



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

