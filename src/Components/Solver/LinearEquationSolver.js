class LinearSystem {
    constructor(a, b){
        this.a = a;
        this.b = b;
        this.length = a.length;
    }

    divideRow = (i, divisor) => {
        this.a[i] = this.a[i].map(value => (value / divisor));
        this.b[i] = this.b[i] / divisor;
    }

    subtractRows = (subtractee, subtractor, scalar = 1) => {
        this.a[subtractee] = Object.keys(this.a[subtractee]).map(i => (
             this.a[subtractee][i] - scalar * this.a[subtractor][i]))
        this.b[subtractee] = this.b[subtractee] - this.b[subtractor] * scalar
    }

    addRows = (addee, adder, scalar = 1) => {
        this.a[addee] = Object.keys(this.a[addee]).map(i => (
             this.a[addee][i] + scalar * this.a[adder][i]))
        this.b[addee] = this.b[addee] + this.b[adder] * scalar
    }

    length = () => {
        return this.a.length
    }

    makeDiagonalNonZero = (j) => {
        // if it is zero
        if (Math.abs(this.a[j][j]) < 1E-7){
            // check row by row for a non-zero element and add it
            for(let i = j + 1; i < this.a.length ; i++){
                if (Math.abs(this.a[i][j]) > 1E-7){
                    this.addRows(j, i);
                    return true;
                }
            }
            return false
        } else {
            return true
        }
    }

    // returns the computed values or false if it fails
    solve = (attempts = null) => {
        for (let j = 0 ; j < this.length ; j++){
            if (this.makeDiagonalNonZero(j)){
                this.divideRow(j, this.a[j][j])
                for (let i = j + 1; i < this.length ; i++){
                    this.subtractRows(i, j, this.a[i][j])
                }
                // if for any reason it has turned negative, make sure that it is not
                this.divideRow(j, this.a[j][j])
            } else {
                console.log('cant make diagonal non-zero')
                console.log(this.a)
                return false
            }
        }
        // diagional should be ones at this point
        // remove top now
        for (let i = 0 ; i < this.length ; i++){
            for (let j = i + 1; j < this.length ; j++){
                this.subtractRows(i, j, this.a[i][j]);
            }
        }
        // check that the system was properly solved
        for (let i = 0; i < this.length ; i++){
            for (let j = 0; j < this.length ; j++){
                if (j !== i && Math.abs(this.a[i][j]) > 1E-7){
                    console.log('some zero element is not zero')
                    console.log(this.a)
                    return false;
                }
            }
        }
        return this.b
    }
}

export const solve = function(a,b){
    const system = new LinearSystem([...a],[...b]);
    return system.solve()
}