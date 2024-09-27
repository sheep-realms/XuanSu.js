class XuanSu {
    constructor() {}

    random(pools = [], seed) {
        if (typeof pools !== 'object') return;
        if (!Array.isArray(pools)) pools = [pools];

        // 归一
        let pools2 = []
        pools.forEach(e => {
            if (typeof e === 'string' || typeof e === 'number') {
                pools2.push({
                    type: 'none',
                    data: {
                        value: e
                    }
                });
            } else if (typeof e !== 'object' || Array.isArray(e)) {
                // 什么也不干
            } else {
                pools2.push(e);
            }
        });
        pools = pools2;

        // 构建
        let value = '';
        let r;
        pools.forEach(e => {
            r = new XuanSuPool(this, e, seed).getValue();
            if (typeof r === 'number' || typeof r === 'string') value += r;
            if (seed !== undefined) seed = this.nextSeed(seed);
        });

        return value;
    }

    /**
     * 带种子随机
     * @param {Number} seed 随机种子
     * @returns {Number} 0 ~ 1 之间的随机数
     */
    seededRandom(seed) {
        if (seed === undefined) seed = Math.floor(Math.random() * 2 ** 32);

        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;

        seed = (a * seed + c) % m;

        return seed / m;
    }

    /**
     * 下一个随机种子
     * @param {Number} seed 随机种子
     * @returns {Number} 随机种子
     */
    nextSeed(seed) {
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;
        return (a * seed + c) % m;
    }

    /**
     * 带权重随机
     * @param {Array<Object>} valueList 候选值列表
     * @param {*} valueList[].value 候选值
     * @param {Number} valueList[].weight 权重
     * @param {Number} seed 随机种子 
     * @returns {*} 随机值
     */
    weightedRandom(valueList, seed) {
        const totalWeight = valueList.reduce((sum, item) => sum + item.weight, 0);

        let randomNum = this.seededRandom(seed) * totalWeight;

        for (let i = 0; i < valueList.length; i++) {
            randomNum -= valueList[i].weight;
            if (randomNum < 0) {
                return valueList[i].value;
            }
        }
    }

    /**
     * 随机选择
     * @param {Array} arr 候选值列表
     * @param {Number} seed 随机种子
     * @returns {*} 随机选择结果
     */
    choose(arr = [], seed) {
        let list = [];
        arr.forEach(e => {
            list.push({
                value: e,
                weight: 1
            });
        });
        return this.weightedRandom(list, seed);
    }

    /**
     * 随机整数
     * @param {Number} max 最大值
     * @param {Number} min 最小值
     * @param {Number} seed 随机种子
     * @returns {Number} 随机整数
     */
    randomInt(max = 1, min = 0, seed) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(this.seededRandom(seed) * (max - min + 1)) + min;
    }

    /**
     * 随机数字 ID
     * @param {Number} length 长度
     * @param {Number} seed 随机种子
     * @returns {String} 随机数字 ID
     */
    randomNumberID(length = 10, seed) {
        let str = '';
        for (let i = 0; i < length; i++) {
            str += this.randomInt(9, 0, seed);
            if (seed !== undefined) seed = this.nextSeed(seed);
        }
        return str;
    }

    /**
     * 随机数字与字符
     * @param {Number} length 长度
     * @param {Number} max 最大值
     * @param {Number} min 最小值
     * @param {Number} seed 随机种子
     * @returns {String} 随机数字与字符
     */
    randomCharacter(length = 10, max = 15, min = 0, seed) {
        if (max > 35) max = 35;
        let str = '';
        let r;
        for (let i = 0; i < length; i++) {
            r = this.randomInt(max, min, seed);
            str += r.toString(max + 1);
            if (seed !== undefined) seed = this.nextSeed(seed);
        }
        return str;
    }

    randomUUID(version = 4, seed) {
        return this.random(
            [
                {
                    type: 'character',
                    data: {
                        length: 8
                    }
                }, {
                    type: 'none',
                    data: {
                        value: '-'
                    }
                }, {
                    type: 'character',
                    data: {
                        length: 4
                    }
                }, {
                    type: 'none',
                    data: {
                        value: `-${ String(version).substring(0, 1) }`
                    }
                }, {
                    type: 'character',
                    data: {
                        length: 3
                    }
                }, {
                    type: 'none',
                    data: {
                        value: '-'
                    }
                }, {
                    type: 'character',
                    data: {
                        length: 4
                    }
                }, {
                    type: 'none',
                    data: {
                        value: '-'
                    }
                }, {
                    type: 'character',
                    data: {
                        length: 12
                    }
                }
            ],
            seed
        )
    }
}



class XuanSuPool {
    constructor(parent, pool = {}, seed) {
        pool = {
            type: undefined,
            data: {},
            ...pool
        }
        this.parent = parent;
        this.pool = pool;
        this.seed = seed;
    }

    run(method = 'none', parameter = []) {
        if (this.parent[method] === undefined) return;
        let par = []
        parameter.forEach(e => {
            par.push(this.pool.data[e])
        });
        return this.parent[method](...par, this.seed);
    }

    getValue() {
        switch (this.pool.type) {
            case 'none':
                return this.pool.data?.value;

            case 'int':
                return this.run('randomInt', ['max', 'min']);

            case 'number_id':
                return this.run('randomNumberID', ['length']);

            case 'character':
                return this.run('randomCharacter', ['length', 'max', 'min']);

            case 'choose':
                return this.run('randomCharacter', ['value']);

            case 'weighted_choose':
                return this.run('weightedRandom', ['value']);

            case 'uuid':
                return this.run('randomCharacter', ['version']);
        
            default:
                break;
        }
    }
}