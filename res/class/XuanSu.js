class XuanSu {
    constructor() {
        let methodRegister = [
            {
                name: 'none',
                data: {
                    method: v => v.value
                }
            }, {
                name: 'random',
                data: {
                    method: 'random',
                    parameter: ['pools']
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
            }, {
                name: 'qq_number',
                data: {
                    method: 'randomQQNumber',
                    parameter: ['max']
                }
            }, {
                name: 'ipv4',
                data: {
                    method: 'randomIPv4',
                    parameter: ['attribute']
                }
            }
        ];

        this.method = new Map();

        methodRegister.forEach(e => {
            this.method.set(e.name, e.data);
        });
    }

    static isPool(value = {}) {
        if (typeof value !== 'object' || Array.isArray(value)) return false;
        if (value?.is_pool !== true) return false;
        return true;
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
                let r = valueList[i].value;
                if (XuanSu.isPool(r)) {
                    if (this.seed !== undefined) this.seed = this.parent.nextSeed(this.seed);
                    r = new XuanSuPool(this, r, seed).getValue();
                }
                return r;
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
        max = max || 1;
        min = min || 0;
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
        mean = mean || 0;
        range = range || 10;

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
        length = length || 10;

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
        length = length || 10;
        max = max || 15;
        min = min || 0;
        if (max > 35) max = 35;
        if (min < 0) min = 0;
        if (max < min) max = min;

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
        version = version || 4;
        return this.random(
            [
                {
                    type: 'character',
                    data: {
                        length: 8
                    }
                }, '-', {
                    type: 'character',
                    data: {
                        length: 4
                    }
                }, `-${ String(version).substring(0, 1) }`, {
                    type: 'character',
                    data: {
                        length: 3
                    }
                }, '-', {
                    type: 'character',
                    data: {
                        length: 4
                    }
                }, '-', {
                    type: 'character',
                    data: {
                        length: 12
                    }
                }
            ],
            seed
        )
    }

    randomQQNumber(max = 4e9, seed) {
        max = max || 4e9;
        return this.random(
            [
                {
                    type: 'int',
                    data: {
                        max: max,
                        min: {
                            is_pool: true,
                            type: 'normal_int',
                            data: {
                                mean: 0,
                                range: 999
                            },
                            modifier: v => 1e9 - Math.abs(v * 1e6)
                        }
                    }
                }
            ],
            seed
        );
    }

    randomIPv4(attribute = {}, seed) {
        attribute = {
            has_class_a: true,
            has_class_b: true,
            has_class_c: true,
            ...attribute
        }

        const block = [
            ['class_a', 1,   126],
            ['class_b', 128, 191],
            ['class_c', 192, 223],
            ['after',   0,   255]
        ]

        const length = {
            'class_a': 2147483520,
            'class_b': 1073709056,
            'class_c': 532676608
        };

        const modifier = {
            'class_a': v => v.replace(/^10/, '11'),
            'class_b': v => /^(172)\.(1[6-9]|2[0-9]|3[0-1])/.test(v) ? v.replace(/^172/, '173') : v,
            'class_c': v => v.replace(/^192\.168/, '192.169')
        };
        
        let pool = {};
        block.forEach(e => {
            pool[e[0]] = {
                type: 'int',
                data: {
                    min: e[1],
                    max: e[2]
                }
            }
        });

        let pools = [];

        function __pushToPools(name) {
            pools.push({
                value: {
                    is_pool: true,
                    type: 'random',
                    data: {
                        pools: [
                            pool[name],
                            '.',
                            pool['after'],
                            '.',
                            pool['after'],
                            '.',
                            pool['after']
                        ]
                    },
                    modifier: modifier[name]
                },
                weight: length[name],
            });
        }

        if (attribute.has_class_a) __pushToPools('class_a');
        if (attribute.has_class_b) __pushToPools('class_b');
        if (attribute.has_class_c) __pushToPools('class_c');

        let p = {
            type: 'weighted_choose',
            data: {
                value: pools
            }
        };

        // return p;
        return this.random(p, seed);
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

    run(method = 'none', parameter = []) {
        if (typeof method === 'function') {
            return method(this.pool.data, this.seed);
        }
        if (this.parent[method] === undefined) return;
        let par = []
        let p;
        parameter.forEach(e => {
            p = this.pool.data[e];
            if (XuanSu.isPool(p)) {
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