class XuanSu {
    constructor() {
        let methodRegister = [
            {
                name: 'none',
                data: {
                    method: v => v.value
                }
            }, {
                name: 'int',
                data: {
                    method: 'randomInt',
                    parameter: ['max', 'min']
                }
            }, {
                name: 'normal_int',
                data: {
                    method: 'normalRandomInt',
                    parameter: ['mean', 'range']
                }
            }, {
                name: 'number_id',
                data: {
                    method: 'randomNumberID',
                    parameter: ['length']
                }
            }, {
                name: 'character',
                data: {
                    method: 'randomCharacter',
                    parameter: ['length', 'max', 'min']
                }
            }, {
                name: 'choose',
                data: {
                    method: 'choose',
                    parameter: ['value']
                }
            }, {
                name: 'weighted_choose',
                data: {
                    method: 'weightedRandom',
                    parameter: ['value']
                }
            }, {
                name: 'uuid',
                data: {
                    method: 'randomUUID',
                    parameter: ['version']
                }
            }
        ];

        this.method = new Map();

        methodRegister.forEach(e => {
            this.method.set(e.name, e.data);
        });
    }

    getMethod(name) {
        return this.method.get(name);
    }

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
     * 正态分布随机整数
     * @param {Number} mean 均值
     * @param {Number} range 范围
     * @param {Number} seed 随机种子
     * @returns {Number} 随机整数
     */
    normalRandomInt(mean = 0, range = 10, seed) {
        let u1, u2, z0;
        do {
            u1 = this.seededRandom(seed);
            if (seed !== undefined) seed = this.nextSeed(seed);
            u2 = this.seededRandom(seed);
            if (seed !== undefined) seed = this.nextSeed(seed);
            z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

            z0 = z0 * (range / 3); 
        } while (z0 < -range || z0 > range);

        return Math.floor(mean + z0 + 0.5);
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
            modifier: undefined,
            ...pool
        }
        this.parent = parent;
        this.pool = pool;
        this.seed = seed;
    }

    __isPool(value = {}) {
        if (typeof value !== 'object' || Array.isArray(value)) return false;
        if (value?.is_pool !== true) return false
        return true;
    }

    run(method = 'none', parameter = []) {
        if (typeof method === 'function') {
            return method(this.pool.data, this.seed);
        }
        if (this.parent[method] === undefined) return;
        let par = []
        let p;
        parameter.forEach(e => {
            p = this.pool.data[e];
            if (this.__isPool(p)) {
                p = new XuanSuPool(this.parent, p, this.seed).getValue();
                if (this.seed !== undefined) this.seed = this.parent.nextSeed(this.seed);
            }
            par.push(p);
        });
        return this.parent[method](...par, this.seed);
    }

    getValue() {
        const methodData = this.parent.getMethod(this.pool.type);
        if (methodData === undefined) return;
        let r = this.run(methodData.method, methodData.parameter);
        if (typeof this.pool.modifier === 'function') r = this.pool.modifier(r);
        return r;
    }
}