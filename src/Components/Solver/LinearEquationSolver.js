class LinearSystem {
    constructor(a, b){
        this.a = a.length > 0 ? a : [[]];
        this.b = b.length > 0 ? b : [[]];
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

    height = () => {
        return this.a.length;
    }

    width = () => {
        return this.a[0].length;
    }

    makeDiagonalNonZero = (j) => {
        // if it is zero
        if (Math.abs(this.a[j][j]) < 1E-7){
            // check row by row for a non-zero element and add it
            for(let i = j + 1; i < this.height() ; i++){
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

    print = () => {
        let text = ''
        for (let i = 0 ; i < this.a.length ; i++){
            for (let j = 0 ; j < this.a[i].length ; j ++){
                text += this.a[i][j] + ', '
            }
            text += '; '
        }
        //console.log(text);
    }

    // returns the computed values or false if it fails
    solve = (options) => {
        // not enough equations
        if (this.height() < this.width()){
            console.log('overdetermined system')
            return false;
        } else if (!options.innerReactions && this.height() !== this.width()){
            console.log('more supports are needed');
            return false;
        } else {
            for (let j = 0 ; j < this.width() ; j++){
                if (this.makeDiagonalNonZero(j)){
                    this.divideRow(j, this.a[j][j])
                    for (let i = j + 1; i < this.height() ; i++){
                        this.subtractRows(i, j, this.a[i][j])
                    }
                    // if for any reason it has turned negative, make sure that it is not
                    this.divideRow(j, this.a[j][j])
                    this.print();

                } else {
                    console.log('cant make diagonal non-zero')
                    return false
                }
            }
            // diagional should be ones at this point
            // remove top now
            for (let i = 0 ; i < this.width() ; i++){
                for (let j = i + 1; j < this.width() ; j++){
                    this.subtractRows(i, j, this.a[i][j]);
                }
            }
            // check that the system was properly solved
            for (let i = 0; i < this.width() ; i++){
                console.log('checking solution');
                for (let j = 0; j < this.width() ; j++){
                    if (j !== i && Math.abs(this.a[i][j]) > 1E-7){
                        console.log('some zero element is not zero')
                        return false;
                    }
                }
                if (Math.abs(this.a[i][i] - 1) > 1E-7){
                    console.log('some value cannot be solved for');
                    return false;
                }
            }
            let solution = [...this.b] /*
            if (this.height() > this.width()){
                solution = [...this.b.splice(0, this.width())];
            } */
            // clean up solution
            solution = solution.map(value => {
                if (Math.abs(value) < 1E-7){
                    return 0;
                } 
                return value;
            })
            const finalSolution = solution.splice(0, this.width());
            return finalSolution;
        }
    }
}

export const solve = function(a,b, options = {}){
    console.log('solving')
    console.log(a);
    console.log(b);
    const system = new LinearSystem([...a],[...b]);
    return system.solve(options)
}