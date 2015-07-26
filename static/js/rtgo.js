//    Title: emitter.js
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


    function emitter(object) {
        object = object && typeof object === 'object'
            ? object
            : {};
        object.events = {};
        object.addListener = function (type, listener) {
            var list = object.events[type];

            if (typeof listener === 'function') {
                if (object.events.newListener) {
                    object.emit('newListener', type, typeof listener.listener === 'function'
                        ? listener.listener
                        : listener);
                }
                if (!list) {
                    object.events[type] = [listener];
                } else {
                    object.events[type].push(listener);
                }
            }
            return object;
        };
        object.on = object.addListener;

        object.once = function (type, listener) {
            function g() {
                object.removeListener(type, g);
                listener.apply(object);
            }
            if (typeof listener === 'function') {
                g.listener = listener;
                object.on(type, g);
            }
            return object;
        };

        object.removeListener = function (type, listener) {
            var list = object.events[type],
                position = -1,
                i;

            if (typeof listener === 'function' && list) {
                for (i = list.length - 1; i >= 0; i -= 1) {
                    if (list[i] === listener || (list[i].listener && list[i].listener === listener)) {
                        position = i;
                        break;
                    }
                }
                if (position >= 0) {
                    if (list.length === 1) {
                        delete object.events[type];
                    } else {
                        list.splice(position, 1);
                    }
                    if (object.events.removeListener) {
                        object.emit('removeListener', type, listener);
                    }
                }
            }
            return object;
        };
        object.off = object.removeListener;

        object.removeAllListeners = function (type) {
            var list,
                i;

            if (!object.events.removeListener) {
                if (!type) {
                    object.events = {};
                } else {
                    delete object.events[type];
                }
            } else if (!type) {
                Object.keys(object.events).forEach(function (key) {
                    if (key !== 'removeListener') {
                        object.removeAllListeners(key);
                    }
                });
                object.removeAllListeners('removeListener');
                object.events = {};
            } else {
                list = object.events[type];
                for (i = list.length - 1; i >= 0; i -= 1) {
                    object.removeListener(type, list[i]);
                }
                delete object.events[type];
            }
            return object;
        };

        object.listeners = function (type) {
            var list = [];

            if (type) {
                if (object.events[type]) {
                    list = object.events[type];
                }
            } else {
                Object.keys(object.events).forEach(function (key) {
                    list.push(object.events[key]);
                });
            }
            return list;
        };

        object.emit = function (type) {
            var list = object.events[type],
                bool = false,
                args = [],
                length,
                i;

            if (list) {
                length = arguments.length;
                for (i = 1; i < length; i += 1) {
                    args[i - 1] = arguments[i];
                }
                length = list.length;
                for (i = 0; i < length; i += 1) {
                    list[i].apply(object, args);
                }
                bool = true;
            }
            return bool;
        };

        return object;
    }


    global.emitter = emitter;


}(window || this));



//    Title: wsrooms.js
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


    function WSRooms(url) {
        if (!global.WebSocket) {
            throw new Error('WebSocket is not supported by this browser.');
        }
        if (!url || typeof url !== 'string') {
            throw new Error('Invalid WebSocket url.');
        }
        emitter(this);
        this.open = false;
        this.id = null;
        this.room = 'root';
        this.members = [];
        this.queue = [];
        this.rooms = {};
        this.socket = new WebSocket(url);
        this.socket.binaryType = 'arraybuffer';
        this.socket.addEventListener('message', this.onmessage.bind(this), false);
        this.socket.addEventListener('close', this.onclose.bind(this), false);
        this.socket.addEventListener('error', this.onerror.bind(this), false);
    }


    WSRooms.prototype.send = function (event, payload, dst) {
        var offset = 0,
            data,
            room,
            src;

        if (typeof event !== 'string') {
            throw new Error('Invalid parameters.');
        }
        if (!this.open && this.room === 'root') {
            this.queue.push([event, payload, dst]);
            return;
        }
        room = this.room;
        dst = dst || '';
        src = this.id;
        if (typeof payload !== 'string' && !(payload instanceof ArrayBuffer || isTypedArray(payload))) {
            payload = JSON.stringify(payload);
        }
        data = new DataView(new ArrayBuffer(room.length + event.length + dst.length + src.length + (payload.length || payload.byteLength || 0) + 20));
        data.setUint32(offset, room.length);
        offset += 4;
        (new Uint8Array(data.buffer)).set(getCodesFromString(room), offset);
        offset += room.length;
        data.setUint32(offset, event.length);
        offset += 4;
        (new Uint8Array(data.buffer)).set(getCodesFromString(event), offset);
        offset += event.length;
        data.setUint32(offset, dst.length);
        offset += 4;
        (new Uint8Array(data.buffer)).set(getCodesFromString(dst), offset);
        offset += dst.length;
        data.setUint32(offset, src.length);
        offset += 4;
        (new Uint8Array(data.buffer)).set(getCodesFromString(src), offset);
        offset += src.length;
        data.setUint32(offset, payload.byteLength || payload.length || 0);
        offset += 4;
        if (typeof payload === 'string') {
            (new Uint8Array(data.buffer)).set(getCodesFromString(payload), offset);
        } else {
            (new Uint8Array(data.buffer)).set(isTypedArray(payload) || Array.isArray(payload)
                ? payload
                : new Uint8Array(payload), offset);
        }
        this.socket.send(data.buffer);
    };


    WSRooms.prototype.onmessage = function (e) {
        var roomObj = this,
            data = new DataView(e.data),
            offset = 0,
            index,
            room,
            event,
            dst,
            src,
            payload;

        room = getStringFromCodes(new Uint8Array(data.buffer, offset + 4, data.getUint32(offset)));
        offset += 4 + room.length;
        event = getStringFromCodes(new Uint8Array(data.buffer, offset + 4, data.getUint32(offset)));
        offset += 4 + event.length;
        dst = getStringFromCodes(new Uint8Array(data.buffer, offset + 4, data.getUint32(offset)));
        offset += 4 + dst.length;
        src = getStringFromCodes(new Uint8Array(data.buffer, offset + 4, data.getUint32(offset)));
        offset += 4 + src.length;
        payload = new Uint8Array(data.buffer, offset + 4, data.getUint32(offset));
        if (room !== 'root' && !this.rooms.hasOwnProperty(room)) {
            throw new Error("Not in room " + room);
        }
        if (room !== 'root') {
            roomObj = this.rooms[room];
        }
        switch (event) {
        case 'join':
            roomObj.id = src;
            roomObj.members = JSON.parse(getStringFromCodes(payload));
            roomObj.open = true;
            roomObj.emit('open');
            roomObj.send('joined', src);
            if (roomObj.room === 'root') {
                while (roomObj.queue.length > 0) {
                    roomObj.send.apply(roomObj, roomObj.queue.shift());
                }
            }
            break;
        case 'joined':
            payload = getStringFromCodes(payload);
            index = roomObj.members.indexOf(payload);
            if (index === -1) {
                roomObj.members.push(payload);
                roomObj.emit('joined', payload);
            }
            break;
        case 'leave':
            if (room === 'root') {
                roomObj.socket.close();
            } else {
                roomObj.open = false;
                roomObj.emit('close');
                delete this.rooms[room];
            }
            roomObj.send('left', roomObj.id);
            break;
        case 'left':
            payload = getStringFromCodes(payload);
            index = roomObj.members.indexOf(payload);
            if (index !== -1) {
                roomObj.members.splice(index, 1);
                roomObj.emit('left', payload);
            }
            break;
        default:
            roomObj.emit(event, payload, src);
            break;
        }
    };


    WSRooms.prototype.join = function (room) {
        var sock = {};

        if (!this.open) {
            throw new Error('Cannot join a room if the root socket is not open.');
        }
        if (!room || typeof room !== 'string' || room === 'root') {
            throw new Error('Cannot join room ' + room);
        }
        if (this.rooms.hasOwnProperty(room)) {
            return this.rooms[room];
        }
        emitter(sock);
        sock.open = false;
        sock.id = '';
        sock.room = room;
        sock.members = [];
        sock.socket = this.socket;
        sock.send = this.send.bind(sock);
        sock.leave = this.leave.bind(sock);
        this.rooms[room] = sock;
        sock.send('join', '');
        return sock;
    };


    WSRooms.prototype.leave = function () {
        this.send('leave', '');
    };


    WSRooms.prototype.purge = function () {
        Object.keys(this.rooms).forEach(function (room) {
            if (room !== 'root') {
                this.rooms[room].leave();
            }
        }, this);
    };


    WSRooms.prototype.onclose = function () {
        Object.keys(this.rooms).forEach(function (room) {
            this.rooms[room].open = false;
            this.rooms[room].emit('close');
            delete this.rooms[room];
        }, this);
        this.open = false;
        this.emit('close');
    };


    WSRooms.prototype.onerror = function (e) {
        this.emit('error', e);
    };


    global.wsrooms = function wsrooms(url) {
        return new WSRooms(url);
    };


    wsrooms.isTypedArray = isTypedArray;
    wsrooms.getStringFromCodes = getStringFromCodes;
    wsrooms.getCodesFromString = getCodesFromString;


}(window || this));



//    Title: rtgo.js
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


    function RTGo() {
        var protocol = global.location.protocol === 'http:'
                ? 'ws://'
                : 'wss://',
            url = protocol + global.location.host + '/ws';

        this.controllers = {};
        this.hash = '';
        this.view = document.querySelector('[data-rt-view]');
        this.hrefs = document.querySelectorAll('[data-rt-href]');
        this.socket = wsrooms(url);
        this.socket.on('open', this.onopen.bind(this));
        this.socket.on('close', this.onclose.bind(this));
        this.socket.on('error', this.onerror.bind(this));
        this.socket.on('response', this.onresponse.bind(this));
        global.addEventListener('hashchange', this.onhashchange.bind(this), false);
    }


    RTGo.prototype.requestView = function requestView(hash) {
        this.socket.send('request', hash || this.hash);
    };


    RTGo.prototype.assignHrefs = function assignHrefs() {
        var hrefs,
            func,
            node,
            x;

        function setup(path) {
            return function () {
                global.location.hash = path.replace(/#/g, '').replace(/(\/\/)/g, '/');
            };
        }

        this.hrefs = document.querySelectorAll('[data-rt-href]');
        hrefs = this.hrefs;
        func = this.popup && typeof this.popup === 'function'
            ? this.popup
            : setup;
        if (hrefs && hrefs.length) {
            for (x = 0; x < hrefs.length; x += 1) {
                node = hrefs[x];
                node.addEventListener('click', func(node.getAttribute('data-rt-href')), false);
            }
        }
    };


    RTGo.prototype.onopen = function onopen() {
        var curhash = global.location.hash;

        if (!curhash) {
            global.location.hash = '/';
        } else {
            global.location.hash = curhash.replace(/#/g, '').replace(/(\/\/)/g, '/');
            this.onhashchange();
        }
    };


    RTGo.prototype.onclose = function onclose() {
        console.log('closed socket');
    };


    RTGo.prototype.onerror = function onerror(e) {
        console.log('socket error:', e);
    };


    RTGo.prototype.onresponse = function onresponse(data) {
        var payload = JSON.parse(wsrooms.getStringFromCodes(data)),
            view = payload.view,
            template = payload.template,
            controllers = payload.controllers && payload.controllers.split(',');

        if (this.view && template) {
            this.view.innerHTML = template;
        }
        if (controllers) {
            controllers.forEach(function (controller) {
                controller = controller.trim();
                if (this.controllers.hasOwnProperty(controller) && typeof this.controllers[controller] === 'function') {
                    this.controllers[controller](global, view);
                }
            }, this);
        }
        this.hrefs = document.querySelectorAll('[data-rt-href]');
        this.assignHrefs();
    };


    RTGo.prototype.onhashchange = function onhashchange() {
        var curhash = global.location.hash;

        if (curhash && this.hash !== curhash && curhash.charAt(1) === '/') {
            this.hash = curhash.replace(/#/g, '').replace(/\/\//g, '/');
            this.requestView();
        }
    };


    global.rtgo = new RTGo();


}(window || this));



//    Title: login.js
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



rtgo.controllers.login = (function login(global) {
    'use strict';


    var formContainer = document.querySelector('.form-container'),
        loginForm = document.querySelector('.form[name="login"]'),
        registerForm = document.querySelector('.form[name="register"]'),
        submit = document.querySelector('.form-button');


    function toggleFadeClass() {
        if (formContainer.classList.contains('fade-down-paused')) {
            formContainer.classList.remove('fade-down-paused');
            formContainer.classList.add('fade-down');
        } else if (formContainer.classList.contains('fade-up')) {
            formContainer.classList.remove('fade-up');
            formContainer.classList.add('fade-down');
        }
    }


    function sendForm(values) {
        var xhr = new XMLHttpRequest(),
            fd = new FormData();

        if (!values.username || !values.password || (values.type === 'register' && !values.email)) {
            return;
        }
        fd.append('username', values.username);
        fd.append('password', sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(values.password)));
        if (values.type === 'register') {
            fd.append('email', values.email);
        }
        xhr.onloadend = function () {
            if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
                console.log('Login success: ' + xhr.response);
            }
        };
        xhr.onerror = function (e) {
            console.log('Login failed: ' + e);
        };
        xhr.open('post', global.location.protocol + '//' + global.location.hostname + ':' + global.location.port + '/' + values.type, true);
        xhr.send(fd);
    }


    function checkFields(e) {
        var wordregx = /^\w+$/,
            emailregx = /^[\w.%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,4}$/,
            form = e.target.getAttribute('data-form'),
            inputs = document.querySelectorAll('form[name="' + form + '"] .form-input'),
            values = {
                type: form
            },
            input,
            name,
            val,
            x;

        function failed() {
            input.parentNode.classList.add('fail');
        }

        for (x = 0; x < inputs.length; x += 1) {
            input = inputs[x];
            name = input.name;
            val = input.value;
            if (((name === 'username' || name === 'password') && !wordregx.test(val)) || (name === 'email' && !emailregx.test(val))) {
                val = '';
            }
            if (!val) {
                input.value = '';
                input.parentNode.classList.remove('fail');
                setTimeout(failed, 200);
            } else {
                values[name] = val;
                input.value = '';
            }
        }
        sendForm(values);
    }
    submit.addEventListener('click', checkFields, false);


    function addGlow(e) {
        var icon = e.target.parentNode.querySelector('.form-input-icon');

        icon.classList.add('glow');
    }
    document.querySelector('.form-input').addEventListener('focus', addGlow, false);


    function removeGlow(e) {
        var icon = e.target.parentNode.querySelector('.form-input-icon');

        icon.classList.remove('glow');
    }
    document.querySelector('.form-input').addEventListener('blur', removeGlow, false);


    return {
        showRegister: function showRegister() {
            loginForm.classList.add('hide');
            registerForm.classList.remove('hide');
            toggleFadeClass();
        },
        showLogin: function showLogin() {
            registerForm.classList.add('hide');
            loginForm.classList.remove('hide');
            toggleFadeClass();
        },
        hideForms: function hideForms() {
            formContainer.classList.add('fade-up');
            formContainer.classList.remove('fade-down');
        }
    };


}(window || this));
