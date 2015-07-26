//    Title: gg.js
//    Author: Jon Cody
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.



(function (global) {
    'use strict';


    var xhrReq,
        readFiles,
        mouseHandler,
        keyboardHandler,
        evHandlers = {},
        ggid = (function () {
            var id = 0;

            return function () {
                id += 1;
                return id;
            };
        }()),
        htmlTagList = [
            'a',
            'abbr',
            'address',
            'area',
            'article',
            'aside',
            'audio',
            'b',
            'base',
            'bdo',
            'blockquote',
            'body',
            'br',
            'button',
            'canvas',
            'caption',
            'cite',
            'code',
            'col',
            'colgroup',
            'dd',
            'del',
            'dfn',
            'div',
            'dl',
            'dt',
            'em',
            'embed',
            'fieldset',
            'figcaption',
            'figure',
            'footer',
            'form',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'head',
            'header',
            'hr',
            'i',
            'iframe',
            'img',
            'input',
            'ins',
            'kbd',
            'label',
            'legend',
            'li',
            'link',
            'map',
            'mark',
            'meta',
            'nav',
            'noscript',
            'object',
            'ol',
            'optgroup',
            'option',
            'p',
            'param',
            'pre',
            'progress',
            'q',
            'rp',
            'rt',
            'ruby',
            's',
            'samp',
            'script',
            'section',
            'select',
            'small',
            'source',
            'span',
            'strong',
            'style',
            'sub',
            'sup',
            'table',
            'tbody',
            'td',
            'textarea',
            'tfoot',
            'th',
            'thead',
            'time',
            'title',
            'tr',
            'track',
            'u',
            'ul',
            'var',
            'video'
        ];


    function typeOf(value) {
        var type = typeof value;

        if (type === 'object') {
            if (Array.isArray(value)) {
                type = 'array';
            } else if (!value) {
                type = 'null';
            }
        }
        return type;
    }


    function noop() {
        return;
    }


    function isBoolean(boolean) {
        return typeOf(boolean) === 'boolean';
    }


    function isNumber(number) {
        return typeOf(number) === 'number';
    }


    function isString(string) {
        return typeOf(string) === 'string';
    }


    function isArray(array) {
        return typeOf(array) === 'array';
    }


    function isTypedArray(array) {
        var arrayTypes = [
                'Int8Array',
                'Uint8Array',
                'Uint8ClampedArray',
                'Int16Array',
                'Uint16Array',
                'Int32Array',
                'Uint32Array',
                'Float32Array',
                'Float64Array'
            ],
            type = Object.prototype.toString.call(array).replace(/\[object\s(\w+)\]/, '$1');

        if (arrayTypes.indexOf(type) > -1) {
            return true;
        }
        return false;
    }


    function isObject(object) {
        return typeOf(object) === 'object';
    }


    function isFunction(func) {
        return typeOf(func) === 'function';
    }


    function isNull(nul) {
        return typeOf(nul) === 'null';
    }


    function isUndefined(undef) {
        return typeOf(undef) === 'undefined';
    }


    function isNode(node) {
        return isObject(node) && isString(node.nodeName) && isNumber(node.nodeType);
    }


    function isEmpty(object) {
        return isObject(object) && Object.keys(object).length === 0;
    }


    function isArrayLike(object) {
        return isObject(object) && object.hasOwnProperty('length') && Object.keys(object).every(function (key) {
            return key === 'length' || !global.isNaN(parseInt(key, 10));
        });
    }


    function toArray(value) {
        return isNode(value) || isBoolean(value) || isNumber(value) || isString(value)
            ? [value]
            : Array.prototype.slice.call(value);
    }


    function inArray(array, value) {
        return isArray(array) && array.indexOf(value) > -1;
    }


    function getById(id) {
        return isString(id) && document.getElementById(id);
    }


    function select(selector) {
        return isString(selector) && document.querySelector(selector);
    }


    function selectAll(selector) {
        return isString(selector) && document.querySelectorAll(selector);
    }


    function toCamelCase(string) {
        return isString(string) && string.replace(/-([a-z])/g, function (a) {
            return a[1].toUpperCase();
        });
    }


    function undoCamelCase(string) {
        return isString(string) && string.replace(/([A-Z])/g, function (a) {
            return '-' + a.toLowerCase();
        });
    }


    function getCodesFromString(string) {
        var len = string.length,
            codes = [],
            x;

        for (x = 0; x < len; x += 1) {
            codes[x] = string.charCodeAt(x) & 0xff;
        }
        return codes;
    }


    function getStringFromCodes(codes) {
        var string = '',
            x;

        for (x = 0; x < codes.length; x += 1) {
            string += String.fromCharCode(codes[x]);
        }
        return string;
    }


    function uuid() {
        var string = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

        return string.replace(/[xy]/g, function (a) {
            var rand = Math.random() * 16 | 0,
                value = a === 'x'
                    ? rand
                    : rand & 0x3 | 0x8;

            return value.toString(16);
        });
    }


    function supplant(string, object) {
        return isString(string) && isObject(object)
            ? string.replace(/\{([^{}]*)\}/g, function (a, b) {
                var value = object[b];

                return !isUndefined(value)
                    ? value
                    : a;
            })
            : string;
    }


    function inherits(ctor, super_ctor) {
        if (isFunction(ctor) && isFunction(super_ctor)) {
            ctor.gg_super = super_ctor;
            ctor.prototype = Object.create(super_ctor.prototype, {
                constructor: {
                    value: ctor,
                    enumberable: false,
                    writable: true,
                    configurable: true
                }
            });
        }
        return ctor;
    }


    function each(items, func, thisarg) {
        if (items && isFunction(func)) {
            if (isNode(items)) {
                func.call(thisarg, items, 0, items);
            } else if (isArrayLike(items)) {
                toArray(items).forEach(func, thisarg);
            } else if (isArray(items)) {
                items.forEach(func, thisarg);
            } else if (isObject(items)) {
                Object.keys(items).forEach(function (key) {
                    func.call(thisarg, items[key], key, items);
                });
            }
        }
        return items;
    }


    function extend(object, add, overwrite) {
        overwrite = isBoolean(overwrite)
            ? overwrite
            : true;
        if (isObject(object) && isObject(add)) {
            each(add, function (value, key) {
                if (overwrite || !object.hasOwnProperty(key)) {
                    object[key] = value;
                }
            });
        }
        return object;
    }


    function handlerClosure(func, node, params) {
        return function (e) {
            return func.call(node, e, params);
        };
    }


    function cloneNodeDeeper(node) {
        var nodeId,
            newNodeId,
            newNode;

        if (node instanceof GG) {
            node = node[0];
        }
        if (isNode(node)) {
            nodeId = node.getAttribute('data-gg-id');
        }
        if (nodeId && evHandlers.hasOwnProperty(nodeId)) {
            newNode = node.cloneNode(true);
            newNodeId = ggid();
            newNode.setAttribute('data-gg-id', newNodeId);
            evHandlers[newNodeId] = {};
            each(evHandlers[nodeId], function (ev_object, ev) {
                evHandlers[newNodeId][ev] = {};
                each(ev_object, function (funcArray, funcId) {
                    var func = funcArray[0],
                        bub = funcArray[2],
                        params = funcArray[3],
                        newFunc = handlerClosure(func, newNode, params);

                    evHandlers[newNodeId][ev][funcId] = [func, newFunc, bub, params];
                    newNode.addEventListener(ev, newFunc, bub);
                });
            });
        }
        return newNode;
    }


    keyboardHandler = (function () {
        var keyDown = function (options, handlers) {
            return function (e) {
                var keycode = e.keyCode;

                if (options.preventDefault) {
                    e.preventDefault();
                }
                if (isNumber(keycode) && handlers.hasOwnProperty(keycode)) {
                    handlers[keycode](e);
                }
            };
        };

        return function (options) {
            var handlers = {};

            options = isObject(options)
                ? options
                : {};
            each(options, function (handler, key) {
                var keycode = parseInt(key, 10);

                if (isFunction(handler) && isNumber(keycode) && !global.isNaN(keycode)) {
                    handlers[keycode] = handler;
                }
            });
            document.addEventListener('keydown', keyDown(options, handlers), false);
        };
    }());


    mouseHandler = (function () {
        var mouseDown = function (options, handlers) {
            return function (e) {
                var keycode = e.button;

                if (options.preventDefault) {
                    e.preventDefault();
                }
                if (isNumber(keycode) && handlers.hasOwnProperty(keycode)) {
                    handlers[keycode](e);
                }
            };
        };

        return function (options) {
            var handlers = {};

            options = isObject(options)
                ? options
                : {};
            each(options, function (handler, key) {
                var keycode = parseInt(key, 10);

                if (isFunction(handler) && isNumber(keycode) && !global.isNaN(keycode)) {
                    handlers[keycode] = handler;
                }
            });
            document.addEventListener('mousedown', mouseDown(options, handlers), false);
        };
    }());


    xhrReq = (function () {
        var responseTypes = [
                '',
                'arraybuffer',
                'blob',
                'document',
                'json',
                'text'
            ],
            forbiddenHeaders = [
                'accept-charset',
                'accept-encoding',
                'access-control-request-headers',
                'access-control-request-method',
                'connection',
                'content-length',
                'cookie',
                'cookie2',
                'date',
                'dnt',
                'expect',
                'host',
                'keep-alive',
                'origin',
                'referer',
                'te',
                'trailer',
                'transfer-encoding',
                'upgrade',
                'user-agent',
                'via'
            ],
            callback = function (options, xhr, type) {
                return function (e) {
                    if (type === 'readystatechange') {
                        if (xhr.readyState === 2) {
                            xhr.responseHeaders = xhr.getAllResponseHeaders();
                        } else if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
                            options.success(e, xhr, xhr.response);
                        }
                    } else if (type === 'abort' || type === 'error' || type === 'timeout') {
                        options.failure(e, xhr);
                    }
                    if (isFunction(options[type])) {
                        options[type](e, xhr);
                    } else if (isFunction(options['on' + type])) {
                        options['on' + type](e, xhr);
                    }
                };
            };

        return function (options) {
            var xhr;

            options = isObject(options)
                ? options
                : {};
            options.data = options.data || null;
            options.method = isString(options.method)
                ? options.method
                : 'GET';
            options.url = isString(options.url)
                ? options.url
                : global.location.href;
            options.async = isBoolean(options.async)
                ? options.async
                : true;
            options.username = isString(options.username)
                ? options.username
                : null;
            options.password = isString(options.password)
                ? options.password
                : null;
            options.mimeType = isString(options.mimeType)
                ? options.mimeType
                : null;
            options.responseType = isString(options.responseType)
                ? options.responseType
                : '';
            options.headers = isObject(options.headers)
                ? options.headers
                : {};
            options.timeout = isNumber(options.timeout)
                ? options.timeout
                : 0;
            options.success = isFunction(options.success)
                ? options.success
                : noop;
            options.failure = isFunction(options.failure)
                ? options.failure
                : noop;
            options.crossOrigin = !new RegExp(global.location.hostname).test(options.url);
            if (!options.crossOrigin && !options.headers['X-Requested-With']) {
                options.headers['X-Requested-With'] = 'XMLHttpRequest';
            }
            xhr = new XMLHttpRequest();
            xhr.open(options.method, options.url, options.async, options.username, options.password);
            each(options.headers, function (header) {
                var lheader = header.toLowerCase();

                if (!inArray(forbiddenHeaders, lheader)) {
                    xhr.setRequestHeader(lheader, options.headers[header].toLowerCase());
                }
            });
            if (options.crossOrigin && options.username && options.password) {
                xhr.withCredentials = true;
            }
            if (options.mimeType && xhr.overrideMimeType) {
                xhr.overrideMimeType(options.mimeType);
            }
            if (options.responseType && inArray(responseTypes, options.responseType)) {
                xhr.responseType = options.responseType;
            }
            xhr.timeout = options.timeout;
            xhr.onreadystatechange = callback(options, xhr, 'readystatechange');
            xhr.onloadstart = callback(options, xhr, 'loadstart');
            if (options.method.toUpperCase() === 'POST') {
                xhr.upload.onprogress = callback(options, xhr, 'progress');
            } else {
                xhr.onprogress = callback(options, xhr, 'progress');
            }
            xhr.onload = callback(options, xhr, 'load');
            xhr.onloadend = callback(options, xhr, 'loadend');
            xhr.onerror = callback(options, xhr, 'error');
            xhr.onabort = callback(options, xhr, 'abort');
            xhr.ontimeout = callback(options, xhr, 'timeout');
            xhr.send(options.data);
        };
    }());


    readFiles = (function () {
        var binary_support = !!global.FileReader.prototype.readAsBinaryString,
            typeMap = {
                arraybuffer: 'readAsArrayBuffer',
                binary: binary_support
                    ? 'readAsBinaryString'
                    : 'readAsArrayBuffer',
                blob: 'readAsArrayBuffer',
                dataurl: 'readAsDataURL',
                text: 'readAsText'
            },
            callback = function (options, filereader, file, type) {
                return function (e) {
                    if (type === 'error' || type === 'abort') {
                        options.failure(e, filereader, file);
                    } else if (type === 'loadend' && (e.target.readyState === 2 || filereader.readyState === 2)) {
                        options.success(e, filereader, file, e.target.result || filereader.result);
                    }
                    if (isFunction(options[type])) {
                        options[type](e, filereader, file);
                    } else if (isFunction(options['on' + type])) {
                        options['on' + type](e, filereader, file);
                    }
                };
            },
            onFileSelect = function (options) {
                return function (e) {
                    each(e.target.files || options.element.files, function (file) {
                        var filereader;

                        if (file.type.match(options.mimeType)) {
                            filereader = new FileReader();
                            filereader.onloadstart = callback(options, filereader, file, 'loadstart');
                            filereader.onprogress = callback(options, filereader, file, 'progress');
                            filereader.onload = callback(options, filereader, file, 'load');
                            filereader.onloadend = callback(options, filereader, file, 'loadend');
                            filereader.onerror = callback(options, filereader, file, 'error');
                            filereader.onabort = callback(options, filereader, file, 'abort');
                            filereader[options.readAs](file);
                        }
                    });
                };
            };

        return function (options) {
            options = isObject(options)
                ? options
                : {};
            options.element = isNode(options.element)
                ? options.element
                : null;
            options.readAs = isString(options.readAs) && typeMap.hasOwnProperty(options.readAs.toLowerCase())
                ? typeMap[options.readAs.toLowerCase()]
                : typeMap.blob;
            options.mimeType = isString(options.mimeType)
                ? options.mimeType
                : '.*';
            options.success = isFunction(options.success)
                ? options.success
                : noop;
            options.failure = isFunction(options.failure)
                ? options.failure
                : noop;
            if (options.element && options.element.nodeName === 'INPUT' && options.element.type === 'file') {
                options.element.addEventListener('change', onFileSelect(options), false);
            }
        };
    }());


    function GG(selector) {
        var items = [];

        if (selector instanceof GG) {
            return;
        }
        if (isString(selector)) {
            items = selectAll(selector);
        } else if (isNode(selector) || isArray(selector) || isArrayLike(selector) || isObject(selector)) {
            items = selector;
        }
        this.length = 0;
        each(items, function (node, index) {
            if (isNode(node) && node.nodeType < 9) {
                this[index] = node;
                this.length += 1;
            }
        }, this);
        return this;
    }


    GG.prototype.each = function (func) {
        return each(this, func);
    };


    GG.prototype.add = function (nodes) {
        return each(nodes, function (node) {
            if (isNode(node)) {
                this[this.length] = node;
                this.length += 1;
            }
        }, this);
    };


    GG.prototype.subtract = function (index) {
        var newthis;

        if (typeOf(index) !== 'number' || index < 0 || index > this.length) {
            return this;
        }
        newthis = toArray(this);
        newthis.splice(index, 1);
        return new GG(newthis);
    };


    GG.prototype.get = function (index) {
        if (typeOf(index) !== 'number' || index < 0 || index > this.length) {
            return this;
        }
        return new GG(this[index]);
    };


    GG.prototype.data = function (name, value) {
        var dataname,
            values;

        if (name && isString(name) && name.length > 4) {
            dataname = name.slice(0, 4) !== 'data'
                ? undoCamelCase('data-' + name)
                : undoCamelCase(name);
            if (isUndefined(value)) {
                values = [];
                this.each(function (node) {
                    values.push(node.getAttribute(dataname));
                });
                return values.length === 1
                    ? values[0]
                    : values;
            }
            return this.each(function (node) {
                node.setAttribute(dataname, value);
            });
        }
        if (isObject(name)) {
            each(name, function (value, key) {
                this.data(key, value);
            }, this);
        }
        if (isArray(name)) {
            values = {};
            name.forEach(function (key) {
                values[key] = this.data(key);
            }, this);
            return values;
        }
        return this;
    };


    GG.prototype.remData = function (name) {
        var dataname;

        if (name && isString(name) && name.length > 4) {
            dataname = name.slice(0, 4) !== 'data'
                ? undoCamelCase('data-' + name)
                : undoCamelCase(name);
            this.each(function (node) {
                node.removeAttribute(dataname);
            });
        } else if (isArray(name)) {
            name.forEach(function (key) {
                this.remData(key);
            }, this);
        }
        return this;
    };


    GG.prototype.attr = function (name, value) {
        var attrname,
            values;

        if (name && isString(name)) {
            attrname = toCamelCase(name);
            if (isUndefined(value)) {
                values = [];
                this.each(function (node) {
                    values.push(node[attrname]);
                });
                return values.length === 1
                    ? values[0]
                    : values;
            }
            return this.each(function (node) {
                node[attrname] = value;
            });
        }
        if (isObject(name)) {
            each(name, function (value, key) {
                this.attr(key, value);
            }, this);
        }
        if (isArray(name)) {
            values = {};
            name.forEach(function (key) {
                values[key] = this.attr(key);
            }, this);
            return values;
        }
        return this;
    };


    GG.prototype.remAttr = function (name) {
        var attrname;

        if (name && isString(name)) {
            attrname = toCamelCase(name);
            this.each(function (node) {
                node.removeAttribute(attrname);
            });
        } else if (isArray(name)) {
            name.forEach(function (key) {
                this.remAttr(key);
            }, this);
        }
        return this;
    };


    GG.prototype.prop = function (name, value) {
        var propname,
            values;

        if (name && isString(name)) {
            propname = toCamelCase(name);
            if (isUndefined(value)) {
                values = [];
                this.each(function (node) {
                    values.push(node.style[propname] || global.getComputedStyle(node, null).getPropertyValue(propname));
                });
                return values.length === 1
                    ? values[0]
                    : values;
            }
            return this.each(function (node) {
                node.style[propname] = value;
            });
        }
        if (isObject(name)) {
            Object.keys(name).forEach(function (key) {
                this.prop(key, name[key]);
            }, this);
        }
        if (isArray(name)) {
            values = {};
            name.forEach(function (key) {
                values[key] = this.prop(key);
            }, this);
            return values;
        }
        return this;
    };
    GG.prototype.css = GG.prototype.prop;
    GG.prototype.style = GG.prototype.prop;


    GG.prototype.remProp = function (name) {
        var propname;

        if (name && isString(name)) {
            propname = toCamelCase(name);
            this.each(function (node) {
                node.style.removeProperty(propname);
            });
        } else if (isArray(name)) {
            name.forEach(function (key) {
                this.remProp(key);
            }, this);
        }
        return this;
    };
    GG.prototype.remCss = GG.prototype.remProp;
    GG.prototype.remStyle = GG.prototype.remProp;


    GG.prototype.text = function (string) {
        var values = [];

        if (isUndefined(string)) {
            this.each(function (node) {
                values.push(node.textContent);
            });
            return values.length === 1
                ? values[0]
                : values;
        }
        return this.each(function (node) {
            if (isString(string)) {
                node.textContent = string;
            }
        });
    };


    GG.prototype.remText = function () {
        return this.each(function (node) {
            node.textContent = '';
        });
    };


    GG.prototype.html = function (string) {
        var values = [];

        if (isUndefined(string)) {
            this.each(function (node) {
                values.push(node.innerHTML);
            });
            return values.length === 1
                ? values[0]
                : values;
        }
        return this.each(function (node) {
            if (isString(string)) {
                node.innerHTML = string;
            }
        });
    };


    GG.prototype.remHtml = function () {
        return this.each(function (node) {
            node.innerHTML = '';
        });
    };


    GG.prototype.classes = function (string) {
        var values = [];

        if (isUndefined(string)) {
            this.each(function (node) {
                values.push(node.className);
            });
            return values.length === 1
                ? values[0]
                : values;
        }
        return this.each(function (node) {
            if (isString(string)) {
                node.className = string.trim();
            }
        });
    };


    GG.prototype.addClass = function (string) {
        if (string && isString(string)) {
            this.each(function (node) {
                string.split(/\s/).forEach(function (cls) {
                    var regex = new RegExp('(?:^|\\s)' + cls + '(?:$|\\s)', 'g');

                    if (!regex.test(node.className)) {
                        node.className = node.className
                            ? node.className + ' ' + cls
                            : cls;
                    }
                });
            });
        }
        return this;
    };


    GG.prototype.remClass = function (string) {
        if (string && isString(string)) {
            this.each(function (node) {
                string.split(/\s/).forEach(function (cls) {
                    var regex = new RegExp('(?:^|\\s)' + cls + '(?:$|\\s)', 'g');

                    node.className = node.className.replace(regex, ' ').trim();
                });
            });
        }
        return this;
    };


    GG.prototype.togClass = function (string) {
        if (string && isString(string)) {
            this.each(function (node) {
                string.split(/\s/).forEach(function (cls) {
                    var regex = new RegExp('(?:^|\\s)' + cls + '(?:$|\\s)', 'g');

                    if (!regex.test(node.className)) {
                        node.className = node.className
                            ? node.className + ' ' + cls
                            : cls;
                    } else {
                        node.className = node.className.replace(regex, ' ').trim();
                    }
                });
            });
        }
        return this;
    };


    GG.prototype.hasClass = function (string) {
        var values = [];

        if (string && isString(string)) {
            this.each(function (node) {
                values.push(string.split(/\s/).every(function (cls) {
                    var regex = new RegExp('(?:^|\\s)' + cls + '(?:$|\\s)', 'g');

                    return regex.test(node.className);
                }));
            });
        }
        return values.length === 1
            ? values[0]
            : values;
    };


    GG.prototype.insert = (function () {
        var positions = ['beforebegin', 'afterbegin', 'beforeend', 'afterend'];

        return function (item, pos) {
            if (item && isString(item)) {
                if (!inArray(positions, pos)) {
                    pos = 'beforeend';
                }
                this.each(function (node) {
                    node.insertAdjacentHTML(pos, item);
                });
            }
            return this;
        };
    }());


    GG.prototype.prepend = function (item) {
        var copy = this.length > 1,
            reversed = isArray(toArray(item))
                ? toArray(item).reverse()
                : item,
            newnodes = [];

        if (isString(item) && inArray(htmlTagList, item)) {
            this.each(function (node) {
                var newnode = document.createElement(item);

                node.insertBefore(newnode, node.firstChild);
                newnodes.push(newnode);
            });
            return new GG(newnodes);
        }
        return this.each(function (node) {
            each(reversed, function (child) {
                if (isNode(child)) {
                    node.insertBefore(copy
                        ? cloneNodeDeeper(child)
                        : child, node.firstChild);
                }
            });
        });
    };


    GG.prototype.prependTo = function (parent) {
        var copy = isArray(toArray(parent)) && toArray(parent).length > 1;

        return this.each(function (node) {
            each(parent, function (par) {
                if (isNode(par)) {
                    par.insertBefore(copy
                        ? cloneNodeDeeper(node)
                        : node, par.firstChild);
                }
            });
        });
    };


    GG.prototype.append = function (item) {
        var copy = this.length > 1,
            newnodes = [];

        if (isString(item) && inArray(htmlTagList, item)) {
            this.each(function (node) {
                var newnode = document.createElement(item);

                node.appendChild(newnode);
                newnodes.push(newnode);
            });
            return new GG(newnodes);
        }
        return this.each(function (node) {
            each(item, function (child) {
                if (isNode(child)) {
                    node.appendChild(copy
                        ? cloneNodeDeeper(child)
                        : child);
                }
            });
        });
    };


    GG.prototype.appendTo = function (parent) {
        var copy = isArray(toArray(parent)) && toArray(parent).length > 1;

        return this.each(function (node) {
            each(parent, function (par) {
                if (isNode(par)) {
                    par.appendChild(copy
                        ? cloneNodeDeeper(node)
                        : node);
                }
            });
        });
    };


    GG.prototype.after = function (item) {
        var copy = this.length > 1,
            newnodes = [];

        if (isString(item) && inArray(htmlTagList, item)) {
            this.each(function (node) {
                var newnode = document.createElement(item);

                node.parentNode.insertBefore(newnode, node.nextSibling);
                newnodes.push(newnode);
            });
            return new GG(newnodes);
        }
        return this.each(function (node) {
            each(item, function (sibling) {
                if (isNode(sibling)) {
                    node.parentNode.insertBefore(copy
                        ? cloneNodeDeeper(sibling)
                        : sibling, node.nextSibling);
                }
            });
        });
    };


    GG.prototype.before = function (item) {
        var copy = this.length > 1,
            reversed = isArray(toArray(item))
                ? toArray(item).reverse()
                : item,
            newnodes = [];

        if (isString(item) && inArray(htmlTagList, item)) {
            this.each(function (node) {
                var newnode = document.createElement(item);

                node.parentNode.insertBefore(newnode, node);
                newnodes.push(newnode);
            });
            return new GG(newnodes);
        }
        return this.each(function (node) {
            each(reversed, function (sibling) {
                if (isNode(sibling)) {
                    node.parentNode.insertBefore(copy
                        ? cloneNodeDeeper(sibling)
                        : sibling, node);
                }
            });
        });
    };


    GG.prototype.remove = function (children) {
        if (isUndefined(children)) {
            return this.each(function (node) {
                node.parentNode.removeChild(node);
            });
        }
        return this.each(function (node) {
            each(children, function (child) {
                if (isNode(child) && node.contains(child)) {
                    node.removeChild(child);
                }
            });
        });
    };


    GG.prototype.parents = function () {
        var nodes = [];

        this.each(function (node) {
            nodes.push(el.parentNode);
        });
        return new GG(nodes);
    };


    GG.prototype.children = function () {
        var nodes = [];

        this.each(function (node) {
            var els = node.childNodes;

            if (els && els.length) {
                nodes = nodes.concat(toArray(els));
            }
        });
        return new GG(nodes);
    };


    GG.prototype.select = function (selector) {
        var nodes = [];

        this.each(function (node) {
            var el = node.querySelector(selector);

            if (el) {
                nodes = nodes.concat(toArray(el));
            }
        });
        return new GG(nodes);
    };


    GG.prototype.selectAll = function (selector) {
        var nodes = [];

        this.each(function (node) {
            var els = node.querySelectorAll(selector);

            if (els && els.length) {
                nodes = nodes.concat(toArray(els));
            }
        });
        return new GG(nodes);
    };


    GG.prototype.clone = function (deep, deeper) {
        var nodes = [];

        deep = typeOf(deep) === 'boolean'
            ? deep
            : false;
        deeper = typeOf(deeper) === 'boolean'
            ? deeper
            : false;
        this.each(function (node) {
            nodes.push(deeper
                ? cloneNodeDeeper(node)
                : node.cloneNode(deep));
        });
        return new GG(nodes);
    };


    GG.prototype.hide = function () {
        return this.each(function (node) {
            node.setAttribute('data-default-display-value', node.style.display);
            node.style.display = 'none';
        });
    };


    GG.prototype.show = function () {
        return this.each(function (node) {
            node.style.display = node.getAttribute('data-default-display-value') || 'initial';
            node.removeAttribute('data-default-display-value');
        });
    };


    GG.prototype.on = function (ev, func, bub, params) {
        var funcId,
            newFunc;

        if (ev && isString(ev) && isFunction(func)) {
            bub = isBoolean(bub)
                ? bub
                : false;
            funcId = func.ggId;
            if (!funcId) {
                funcId = ggid();
                func.ggId = funcId;
            }
            this.each(function (node) {
                var nodeId = node.getAttribute('data-gg-id');

                if (!nodeId) {
                    nodeId = ggid();
                    node.setAttribute('data-gg-id', nodeId);
                }
                if (!evHandlers.hasOwnProperty(nodeId)) {
                    evHandlers[nodeId] = {};
                }
                if (!evHandlers[nodeId].hasOwnProperty(ev)) {
                    evHandlers[nodeId][ev] = {};
                }
                newFunc = handlerClosure(func, node, params);
                evHandlers[nodeId][ev][funcId] = [func, newFunc, bub, params];
                node.addEventListener(ev, newFunc, bub);
            });
        }
        return this;
    };


    GG.prototype.off = function (ev, func, bub) {
        var funcId = isFunction(func) && func.ggId;

        if (ev && isString(ev)) {
            bub = isBoolean(bub)
                ? bub
                : false;
            this.each(function (node) {
                var nodeId = node.getAttribute('data-gg-id');

                if (nodeId && evHandlers.hasOwnProperty(nodeId) && evHandlers[nodeId].hasOwnProperty(ev)) {
                    if (isUndefined(func)) {
                        each(evHandlers[nodeId][ev], function (f, fid, object) {
                            node.removeEventListener(ev, f, bub);
                            delete object[fid];
                        });
                        delete evHandlers[nodeId][ev];
                    } else if (evHandlers[nodeId][ev].hasOwnProperty(funcId)) {
                        node.removeEventListener(ev, evHandlers[nodeId][ev][funcId][1], bub);
                        delete evHandlers[nodeId][ev][funcId];
                    }
                }
            });
        }
        return this;
    };


    GG.prototype.once = function (ev, func, bub, params) {
        function handler(node, params) {
            return function onetime(e) {
                func.call(node, e, params);
                node.removeEventListener(ev, onetime, bub);
            };
        }
        if (ev && isString(ev) && isFunction(func)) {
            bub = isBoolean(bub)
                ? bub
                : false;
            this.each(function (node) {
                node.addEventListener(ev, handler(node, params), bub);
            });
        }
        return this;
    };


    function gg(selector) {
        return new GG(selector);
    }
    gg.typeOf = typeOf;
    gg.noop = noop;
    gg.isBoolean = isBoolean;
    gg.isNumber = isNumber;
    gg.isString = isString;
    gg.isTypedArray = isTypedArray;
    gg.isArray = isArray;
    gg.isObject = isObject;
    gg.isFunction = isFunction;
    gg.isNull = isNull;
    gg.isUndefined = isUndefined;
    gg.isNode = isNode;
    gg.isEmpty = isEmpty;
    gg.isArrayLike = isArrayLike;
    gg.toArray = toArray;
    gg.inArray = inArray;
    gg.toCamelCase = toCamelCase;
    gg.undoCamelCase = undoCamelCase;
    gg.getCodesFromString = getCodesFromString;
    gg.getStringFromCodes = getStringFromCodes;
    gg.getById = getById;
    gg.select = select;
    gg.selectAll = selectAll;
    gg.uuid = uuid;
    gg.supplant = supplant;
    gg.inherits = inherits;
    gg.extend = extend;
    gg.each = each;
    gg.cloneNodeDeeper = cloneNodeDeeper;
    gg.keyboardHandler = keyboardHandler;
    gg.mouseHandler = mouseHandler;
    gg.xhrReq = xhrReq;
    gg.readFiles = readFiles;

    global.gg = gg;

}(window || this));
