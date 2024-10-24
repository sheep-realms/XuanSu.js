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
                    parameter: ['options']
                }
            }
        ];

        this.method = new Map();
        this.seed = undefined;
        this.seedCache = undefined;
        this.registry = new XuanSuRegistry();
        this.loader = new XuanSuLoader(this);
        this.launcher = new XuanSuLauncher(this);

        methodRegister.forEach(e => {
            this.method.set(e.name, e.data);
        });
    }

    /**
     * 检查是否是随机池
     * @param {Object} value 对象
     * @returns {Boolean} 结果
     */
    static isPool(value = {}) {
        if (typeof value !== 'object' || Array.isArray(value)) return false;
        if (value?.is_pool !== true) return false;
        return true;
    }

    /**
     * 获取随机方法数据
     * @param {String} name 随机类型名
     * @returns {Object} 随机方法数据
     */
    getMethod(name) {
        return this.method.get(name);
    }

    /**
     * 运行随机池
     * @param {Array<Object>|Object} pools 随机池数据
     * @param {Number} seed 随机种子
     * @returns {*} 随机结果
     */
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
        this.seed = seed;
        let value = '';
        let r;
        pools.forEach(e => {
            r = new XuanSuPool(this, e, seed).getValue();
            if (typeof r === 'number' || typeof r === 'string') value += r;
        });

        this.clearSeed();

        return value;
    }

    /**
     * 带种子随机
     * @param {Number} seed 随机种子
     * @returns {Number} 0 ~ 1 之间的随机数
     */
    seededRandom(seed) {
        if (this.seedCache !== undefined) seed = this.seedCache;
        if (seed === undefined) {
            if (this.seed === undefined) {
                seed = Math.floor(Math.random() * 2 ** 32);
            } else {
                seed = this.seed
            }
        }

        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;

        seed = (a * seed + c) % m;
        this.seedCache = seed;

        return seed / m;
    }

    /**
     * 下一个随机种子
     * @param {Number} seed 随机种子
     * @returns {Number} 随机种子
     */
    nextSeed(seed) {
        if (seed === undefined && this.seedCache !== undefined) seed = this.seedCache;
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;
        let s = (a * seed + c) % m;
        this.seedCache = s;
        return s;
    }

    /**
     * 清空随机种子
     */
    clearSeed() {
        this.seed = undefined;
        this.seedCache = undefined;
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
            u2 = this.seededRandom(seed);
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
        }
        return str;
    }

    /**
     * 随机 UUID
     * @param {Number} version UUID 版本号
     * @param {Number} seed 随机种子
     * @returns {String} 随机 UUID
     * @description 请注意这并非真正的 UUID！
     */
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

    /**
     * 随机 QQ 号
     * @param {Number} max 最大值
     * @param {Number} seed 随机种子
     * @returns {Number} 随机 QQ 号
     */
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

    /**
     * 随机 IPv4 地址
     * @param {Object} options 属性
     * @param {Boolean} options.has_class_a 使用 A 类地址
     * @param {Boolean} options.has_class_b 使用 B 类地址
     * @param {Boolean} options.has_class_c 使用 C 类地址
     * @param {Number} seed 随机种子
     * @returns {String} 随机 IPv4 地址
     */
    randomIPv4(options = {}, seed) {
        options = {
            has_class_a: true,
            has_class_b: true,
            has_class_c: true,
            ...options
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

        if (options.has_class_a) __pushToPools('class_a');
        if (options.has_class_b) __pushToPools('class_b');
        if (options.has_class_c) __pushToPools('class_c');

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
    /**
     * 随机池
     * @param {XuanSu} parent 父级对象
     * @param {Object} pool 随机池数据
     * @param {Number} seed 随机种子
     */
    constructor(parent, pool = {}, seed) {
        pool = {
            type: undefined,
            import: undefined,
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

        if (this.pool.import !== undefined) {
            for (const key in this.pool.import) {
                if (Object.prototype.hasOwnProperty.call(this.pool.import, key)) {
                    const e = this.pool.import[key];
                    if (e?.name === undefined) continue;
                    this.pool.data[key] = this.parent.registry.getRegistryValue(
                        e?.table ?? 'data',
                        e.name
                    );
                }
            }
            this.pool.import = undefined;
        }

        let par = []
        let p;
        parameter.forEach(e => {
            p = this.pool.data[e];
            if (XuanSu.isPool(p)) {
                p = new XuanSuPool(this.parent, p, this.seed).getValue();
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



class XuanSuLoader {
    constructor(parent) {
        this.parent = parent;
        this.path = '';
    }

    setPath(path) {
        this.path = path;
    }

    load(url) {
        let s = document.createElement('script');
        s.src = this.path + url;
        document.head.appendChild(s);
    }
}



class XuanSuLauncher {
    constructor(parent) {
        this.parent = parent;
        this.launchTasks = [];
        this.lastTaskID = 0;
    }

    addTask(id, timer, resource, options = {}, requestOptions = {}, callback = () => {}) {
        let data = {
            id: id,
            timer: timer,
            resource: resource,
            options: options,
            requestOptions: requestOptions,
            callback: callback
        }
        this.launchTasks.push(data);
        return data;
    }

    findTaskIndex(id) {
        return this.launchTasks.findIndex(e => e.id == id);
    }

    findTask(id) {
        let r = this.launchTasks.filter(e => e.id == id);
        if (r.length === 0) return;
        return r[0];
    }

    stopTask(id) {
        let r = this.findTask(id);
        clearInterval(r.timer);
        let i = this.findTaskIndex(id);
        this.launchTasks.splice(i, 1);
    }

    launch(resource, options = {}, requestOptions = {}, callback = () => {}) {
        options = {
            body: [],
            contentType: 'json',
            limit: -1,
            interval: 1000,
            ...options
        };
        requestOptions = {
            headers: {},
            body: null,
            method: 'GET',
            ...requestOptions
        };

        let id = this.lastTaskID++;

        let timer = setInterval(() => {
            this.run(id);
        }, options.interval)

        this.addTask(id, timer, resource, options, requestOptions, callback);
    }

    run(id) {
        let data = this.findTask(id);
        let requestOptions = JSON.parse(JSON.stringify(data.requestOptions))
        let search = new URLSearchParams();
        let r;
        data.options.body.forEach(e => {
            if (e?.value !== undefined) {
                search.append(e.name, e.value);
            } else {
                r = this.parent.random(e.pools);
                search.append(e.name, r);
            }
        });

        try {
            if (requestOptions.method === 'GET') this.get(data.resource, search, requestOptions).them(data.callback);

            let jsonData = {};

            switch (data.options.contentType) {
                case 'json':
                    search.forEach((value, key) => {
                        jsonData[key] = value
                    });
                    requestOptions = {
                        body: JSON.stringify(jsonData)
                    };
                    this.post(data.resource, requestOptions);
                    break;

                case 'search':
                    requestOptions = {
                        body: search.toString()
                    };
                    this.post(data.resource, requestOptions);
                    break;
            
                default:
                    break;
            }
        } catch (error) {
            
        }

        if (data.options.limit > 0) data.options.limit--;
        if (data.options.limit == 0) this.stopTask(id);
    }

    send(resource, options) {
        options = {
            headers: {},
            body: null,
            method: 'GET',
            ...options
        };
        return fetch(resource, options);
    }

    get(resource, search, options) {
        options = {
            method: 'GET',
            ...options
        };
        return this.send(resource + '?' + search.toString(), options);
    }

    post(resource, options) {
        options = {
            method: 'POST',
            ...options
        };
        return this.send(resource, options);
    }
}



class XuanSuData {
    constructor() {}

    static dataType = {
        namespace_id: {
            type: 'string',
            regexp: /^[^:]+(:[^:]+)+$/,
            filter: {
                pad_namespace:  (v, unit, data) => unit.check() ? v : ( data?.namespace ? data.namespace : 'xuansu:' ) + v,
                get_namespace:  (v, unit)       => unit.check() ? v.split(':')[0] : '',
                get_id:         (v, unit)       => unit.check() ? v.split(':').slice(1).join(':') : v
            }
        }
    };

    static check(type, value) {
        if (XuanSuData.dataType[type] === undefined) return false;
        if (typeof value !== XuanSuData.dataType[type].type) return false;
        return XuanSuData.dataType[type].regexp.test(value);
    }

    static filter(type, filterName, value, data = {}, strictMode = false) {
        if (
            XuanSuData.dataType[type] === undefined
            || typeof value !== XuanSuData.dataType[type].type
            || XuanSuData.dataType[type].filter === undefined
            || typeof XuanSuData.dataType[type].filter[filterName] !== 'function'
        ) return strictMode ? undefined : value;
        return XuanSuData.dataType[type].filter[filterName](value, new XuanSuDataUnit(type, value, filterName), data);
    }
}





class XuanSuDataUnit {
    constructor(type, value, filterName) {
        this.type = type;
        this.value = value;
        this.filterName = filterName;
    }

    check(value = this.value) {
        return XuanSuData.check(this.type, value);
    }

    filter(filter, value = this.value, data = {}, strictMode = false) {
        if (filter === this.filterName) return;
        return XuanSuData.check(this.type, filter, value, data, strictMode);
    }
}



class XuanSuRegistry {
    constructor() {
        this.registry = new Map();
        this.event = {
            setRegistryValue: []
        };
        this.lastTriggerID = 0;

        this.createRegistry('data');
    }

    // 注册表数量
    get registryCount() {
        return this.registry.size;
    }

    // 注册表项数量
    get itemCount() {
        let count = 0;
        this.registry.forEach(e => count += e.size);
        return count;
    }

    /**
     * 深度合并对象
     * @param {Object} target 目标对象
     * @param {Object} source 来源对象
     * @returns {Object} 合并结果
     */
    static __deepMerge(target, source) {
        target = JSON.parse(JSON.stringify(target));
        for (let key in source) {
            if (
                source[key] instanceof Object &&
                !Array.isArray(source[key]) &&
                key in target &&
                target[key] instanceof Object &&
                !Array.isArray(target[key]) 
            ) {
                target[key] = XuanSuRegistry.__deepMerge(target[key], source[key]);
            } else if (Array.isArray(source[key]) && key in target && Array.isArray(target[key])) {
                target[key] = target[key].concat(source[key]);
            } else if (source[key] !== undefined) {
                target[key] = source[key];
            }
        }
        return target;
    }

    /**
     * 绑定设置注册表值触发
     * @param {String} table 注册表名
     * @param {String} key 注册表键
     * @param {Function} action 方法
     * @returns {Number} 触发器 ID
     */
    onSetRegistryValue(table, key = '*', action = () => {}) {
        table = XuanSuData.filter('namespace_id', 'pad_namespace', table);
        const id = this.lastTriggerID++
        this.event.setRegistryValue.push({
            id: id,
            table: table,
            key: key,
            action: action
        });
        return id;
    }

    /**
     * 激活触发
     * @param {String} event 事件名
     * @param {String} table 注册表名
     * @param {String} key 注册表值
     * @param {Object} data 附加数据
     */
    trigger(event, table, key, data = {}) {
        if (this.event[event] === undefined) return;
        table = XuanSuData.filter('namespace_id', 'pad_namespace', table);
        this.event[event].filter(e => e.table === table && (e.key === key || e.key === '*')).forEach(e => e.action(data));
    }

    /**
     * 清除触发器
     * @param {String} event 事件名
     * @param {Number} id 触发器 ID
     */
    killTrigger(event, id) {
        if (this.event[event] === undefined) return;
        const index = this.event[event].findIndex(e => e.id = id);
        this.event[event].splice(index, 1);
    }

    /**
     * 获取注册表
     * @param {String} key 注册表名
     * @returns {Map} 注册表
     */
    getRegistry(key) {
        if (typeof key !== 'string') return;
        key = XuanSuData.filter('namespace_id', 'pad_namespace', key);
        let reg = this.registry.get(key);
        if (reg !== undefined && reg instanceof Map) return reg;
        return;
    }

    /**
     * 创建注册表
     * @param {String} key 注册表名
     * @returns {Map} 注册表
     */
    createRegistry(key) {
        key = XuanSuData.filter('namespace_id', 'pad_namespace', key);
        if (!XuanSuData.check('namespace_id', key)) return;
        if (this.registry.get(key) !== undefined) return;
        return this.registry.set(key, new Map());
    }

    /**
     * 获取注册表数组
     * @param {String} key 注册表名
     * @returns {Array} 注册表数组
     */
    getRegistryArray(key) {
        let array = [];
        this.forEach(key, e => {
            array.push(e);
        });
        return array;
    }

    /**
     * 获取注册表单位
     * @param {String} key 注册表名
     * @returns {XuanSuRegistryUnit} 注册表单位
     */
    getRegistryUnit(key) {
        let reg = this.getRegistry(key);
        if (reg === undefined) return;
        return new XuanSuRegistryUnit(this, key);
    }

    /**
     * 获取注册表内容尺寸
     * @param {String} key 注册表名
     * @returns {Number} 注册表内容尺寸
     */
    getRegistrySize(key) {
        let reg = this.getRegistry(key);
        if (reg === undefined) return;
        return reg.size;
    }

    /**
     * 获取注册表值
     * @param {String} table 注册表名
     * @param {String} key 注册表键
     * @returns {*} 注册表值
     */
    getRegistryValue(table, key) {
        let reg = this.getRegistry(table);
        if (reg === undefined) return;
        let value = reg.get(key);
        if (typeof value === 'object') return JSON.parse(JSON.stringify(value));
        return reg.get(key);
    }

    /**
     * 在所有命名空间中获取注册表值
     * @param {String} table 注册表名
     * @param {String} key 注册表键
     * @returns {Array<*>} 注册表值数组
     */
    getAllNamespaceRegistryValue(table, key) {
        let array = [];
        this.registry.forEach((v, k) => {
            let name = XuanSuData.filter('namespace_id', 'get_id', k);
            if (name == table) {
                let v2;
                if (key !== undefined) {
                    v2 = this.getRegistryValue(k, key);
                    if (v2 !== undefined) array.push(v2);
                } else {
                    v2 = this.getRegistryArray(k);
                    array.push(...v2);
                }
            }
        });
        return array;
    }

    /**
     * 设置注册表值
     * @param {String} table 注册表名
     * @param {String} key 注册表键
     * @param {*} value 注册表值
     * @param {Data} data 附加数据
     * @param {Boolean} data.fill 强制覆盖
     * @param {Boolean} data.trigger_disable 禁用触发
     * @returns {*} 合并后的注册表值
     */
    setRegistryValue(table, key, value, data = {}) {
        if (key === undefined) return;
        table = XuanSuData.filter('namespace_id', 'pad_namespace', table);
        let reg = this.getRegistry(table);
        if (reg === undefined) return;

        data = {
            fill: false,
            trigger_disable: false,
            ...data
        }

        if (typeof value === 'object') value = JSON.parse(JSON.stringify(value));

        const __setReg = v2 => {
            reg.set(key, v2);
            if (!data.trigger_disable) this.trigger('setRegistryValue', table, key, { value: v2 });
            return v2;
        }

        let v = reg.get(key);
        if (!data.fill && typeof v === 'object' && !Array.isArray(v) && typeof value === 'object' && !Array.isArray(value)) {
            v = XuanSuRegistry.__deepMerge(v, value);
            return __setReg(v);
        } else if (!data.fill && Array.isArray(v)) {
            if (Array.isArray(value)) {
                value.forEach(e => {
                    if (!v.includes(e)) v.push(e);
                });
            } else {
                if (!v.includes(e)) v.push(e);
            }
            return __setReg(v);
        } else {
            return __setReg(value);
        }
    }

    /**
     * 导入注册表
     * @param {String} table 注册表名
     * @param {String|Function} getKey 注册表键
     * @param {Array|Object} data 数据表
     * @returns {Map} 注册表
     */
    loadRegistry(table, getKey, data = []) {
        let reg = this.getRegistry(table);
        if (reg === undefined) return;
        if (typeof data !== 'object') return;
        if (!Array.isArray(data)) data = [data];
        data.forEach(e => {
            let key;
            if (typeof getKey === 'function') {
                key = getKey(e);
            } else {
                key = e[getKey];
            }
            this.setRegistryValue(table, key, e);
        });
        return this.getRegistry(table);
    }

    /**
     * 注册表重定向
     * @param {String} table 源注册表名
     * @param {String} table2 目标注册表名
     * @param {String} key 源注册表键
     * @param {Function} success 成功回调
     * @param {Function} fail 失败回调
     * @returns {*} 回调返回值
     */
    registryRedirect(table, table2, key, success = () => {}, fail = () => {}) {
        let value = this.getRegistryValue(table, key);
        if (value === undefined || (typeof value !== 'string' && typeof value !== 'number')) return fail(value);
        let regValue = this.getRegistryValue(table2, value);
        if (value === undefined) return fail(value);
        return success(regValue, value);
    }

    /**
     * 遍历注册表
     * @param {String} table 注册表名
     * @param {Function} action 方法
     */
    forEach(table, action = () => {}) {
        let reg = this.getRegistry(table);
        if (reg === undefined) return;
        reg.forEach(action);
    }

    /**
     * 遍历注册表获取数组
     * @param {String} table 注册表名
     * @param {Function} action 方法
     * @returns {Array} 数组
     */
    forEachGetArray(table, action = () => {}) {
        let array = [];
        this.forEach(table, (value, key, map) => {
            array.push(action(value, key, map));
        });
        return array;
    }
}

class XuanSuRegistryUnit {
    /**
     * Echo-Live 注册表单位
     * @param {XuanSuRegistry} registry 注册表类
     * @param {String} name 注册表名
     */
    constructor(registry, name) {
        this.registry = registry;
        this.name = name;
    }

    get size() {
        return this.registry.getRegistrySize(this.name);
    }

    get() {
        return this.registry.getRegistry(this.name);
    }

    getArray() {
        return this.registry.getRegistryArray(this.name);
    }

    getValue(key) {
        return this.registry.getRegistryValue(this.name, key);
    }

    setValue(key, value) {
        return this.registry.setRegistryValue(this.name, key, value);
    }
}



const xuansu = new XuanSu();