let V3_ENDPOINT = 'https://{node_host}:{node_port}'

let APIS = {}
APIS.V3_ECHO = '/v3/kv/range'
APIS.V3_AUTH = '/v3/auth/authenticate'
APIS.V3_VERSION = '/version'

APIS.V3_AUTH_USER_LIST = '/v3/auth/user/list'
APIS.V3_AUTH_USER_ADD = '/v3/auth/user/add'
APIS.V3_AUTH_USER_DELETE = '/v3/auth/user/delete'
APIS.V3_AUTH_USER_CHNAGEPW = '/v3/auth/user/changepw'
APIS.V3_AUTH_USER_GET = '/v3/auth/user/get'
APIS.V3_AUTH_USER_REVOKE = '/v3/auth/user/revoke'
APIS.V3_AUTH_USER_GRANT = '/v3/auth/user/grant'

APIS.V3_AUTH_ROLE_LIST = '/v3/auth/role/list'
APIS.V3_AUTH_ROLE_ADD = '/v3/auth/role/add'
APIS.V3_AUTH_ROLE_DELETE = '/v3/auth/role/delete'
APIS.V3_AUTH_ROLE_GET = '/v3/auth/role/get'
APIS.V3_AUTH_ROLE_REVOKE = '/v3/auth/role/revoke'
APIS.V3_AUTH_ROLE_GRANT = '/v3/auth/role/grant'

APIS.V3_AUTH_STATUS = '/v3/auth/status'
APIS.V3_AUTH_ENABLE = '/v3/auth/enable'
APIS.V3_AUTH_DISABLE = '/v3/auth/disable'

APIS.V3_CLUSTER_MEMBER_LIST = '/v3/cluster/member/list'
APIS.V3_CLUSTER_MEMBER_ADD = '/v3/cluster/member/add'
APIS.V3_CLUSTER_MEMBER_REMOVE = '/v3/cluster/member/remove'
APIS.V3_CLUSTER_MEMBER_UPDATE = '/v3/cluster/member/update'
APIS.V3_CLUSTER_MEMBER_PROMOTE = '/v3/cluster/member/promote'

APIS.V3_MAINTEANCE_STATUS = '/v3/maintenance/status'
APIS.V3_MAINTEANCE_TRANSFER = '/v3/maintenance/transfer-leadership'
APIS.V3_MAINTEANCE_SNAPSHOT = '/v3/maintenance/snapshot'
APIS.V3_MAINTEANCE_VERSION = '/version'


APIS.V3_RANGE = '/v3/kv/range'
APIS.V3_RANGE_DEL = '/v3/kv/deleterange'
APIS.V3_RANGE_PUT = '/v3/kv/put'

APIS.V3_LEASE_ALL = '/v3/kv/lease/leases'
APIS.V3_LEASE_TIMETOLIVE = '/v3/kv/lease/timetolive'
APIS.V3_LEASE_REVOKE = '/v3/kv/lease/revoke'
APIS.V3_LEASE_GRANT = '/v3/lease/grant'
APIS.V3_LEASE_KEEPALIVE = '/v3/lease/keepalive'

APIS.V3_WATCH_WATCH = '/v3/watch'


let ETC4GO_LOCK_FORMAT = "/etcd4go-lock/#lock/_"
let ETC4GO_LOCK_INFO_PREFIX = "/etcd4go-lock/#info/"
let ETC4GO_LOCK_INFO_FORMAT = ETC4GO_LOCK_INFO_PREFIX + "_"
let ETC4GO_LOCK_REQUEST_INFO_PREFIX = "/etcd4go-lock/#request/_{key}/"
let ETC4GO_LOCK_REQUEST_INFO_FORMAT = ETC4GO_LOCK_REQUEST_INFO_PREFIX + "_{leaseid}"

// function
$.app.beforeRequest = function (options) {
    console.log("$.app.beforeRequest")

    if (options.headers && options.headers.isetcd) {
        //let data = options.data;
        options.isetcd = options.headers.isetcd

        delete options.headers.Authorization

        if (!$.extends.isEmpty(options.headers.token)) {
            options.headers.Authorization = options.headers.token

        }

        delete options.headers.isetcd
        delete options.headers.uid
        delete options.headers.token
    }

    console.log(options)
}

$.app.afterSuccess = function (options, response) {

    if (options.headers.isetcd || response.xhr.getResponseHeader("Grpc-Metadata-Content-Type") == "application/grpc") {
        let data = response.data

        if (data && typeof data == 'object') {
            data.status = 0
            response.data = data
        } else {
        }
    }

    console.log("$.app.afterSuccess")
    console.log(response)
}

$.app.afterError = function (options, response) {
    console.log("$.app.afterError")
    console.log(response)
}

$.etcd = {}

$.etcd.ajaxStream = function (url, datastr, fn, requestHeader, options) {

    if (requestHeader == null) {
        requestHeader = {};
    }

    requestHeader['Content-Type'] = 'application/json; charset=UTF-8';
    /**/

    if (!$.extends.isEmpty(requestHeader.token)) {
        requestHeader.Authorization = requestHeader.token;
        delete requestHeader.token;

    }

    let opt = $.extend({
        headers: requestHeader,
        method: 'POST',
        data: datastr
    }, options);
    /*
        if(successFn)
            options.success = successFn;

        if(errorFn)
            options.error = errorFn;
            )
     */

    $.app.ajaxStream(url, opt,
        function (xhr, state, chunk) {
            if (!$.extends.isEmpty(chunk)) {
                if (fn) {
                    fn(xhr, state, chunk)
                }
            }
        });
}

$.etcd.getJson = function (url, datastr, fn, requestHeader, progressing) {
    let u = new URL(url);
    if (requestHeader == null) {
        requestHeader = {
            'etcd-node': u.host,
        };
    }

    requestHeader.isetcd = true

    if (typeof datastr == 'object') {
        datastr = $.extends.json.tostring(datastr)
    }

    requestHeader['Content-Type'] = 'application/json; charset=UTF-8';
    requestHeader['etcd-node'] = u.host;

    u.protocol = document.location.protocol
    u.host = window.location.host;
    u.port = window.location.port
    $.app.ajax(u.toString(), datastr, 'GET', "json", fn, true, progressing, requestHeader);
};


$.etcd.postJson = function (url, datastr, fn, requestHeader, progressing) {

    let u = new URL(url);
    if (requestHeader == null) {
        requestHeader = {
            'etcd-node': u.host,
        };
    }

    requestHeader.isetcd = true

    if (typeof datastr == 'object') {
        datastr = $.extends.json.tostring(datastr)
    }

    requestHeader['Content-Type'] = 'application/json; charset=UTF-8';
    requestHeader['etcd-node'] = u.host;

    u.protocol = document.location.protocol
    u.host = window.location.host;
    u.port = window.location.port
    $.app.ajax(u.toString(), datastr, 'POST', "json", fn, true, progressing, requestHeader);
};

$.etcd.callback = {
    authorizeRefreshed: function (token, response) {
    },
    tokenInvalid: function () {
    }
}

$.etcd.request = {
    prefixFormat: function (prefix) {
        if ($.extends.isEmpty(prefix))
            return prefix;

        if (prefix.length == 1) {
            return String.fromCharCode(prefix.charCodeAt(0) + 1)
        } else {
            return prefix.substring(0, prefix.length - 1) + String.fromCharCode(prefix.charCodeAt(prefix.length - 1) + 1)
        }
    },
    buildTokenHeader: function (serverInfo) {
        if (serverInfo.authorized_enabled != '1') {
            return {};
        }

        return {"token": serverInfo.node_token};
    },
    ajaxStream: function (serverInfo, url, data, fn, options) {
        $.etcd.request.kv.range(function (response) {
            if ($.etcd.response.retoken(serverInfo, response))
                return;

            if ($.etcd.response.check(response)) {
                $.etcd.ajaxStream(url, data, fn, $.etcd.request.buildTokenHeader(serverInfo), options)
            }
        }, serverInfo, '___', null, null, true)
    },
    debug: function (fn, serverInfo, uri, data) {
        $.etcd.request.execute(serverInfo, function (node) {
            $.etcd.postJson(V3_ENDPOINT.format2(node) + uri, data, function (response) {
                if ($.etcd.response.retoken(serverInfo, response))
                    return;

                if ($.etcd.response.check(response)) {
                    if (fn && $.isFunction(fn)) {
                        fn.call(node, response)
                    }
                } else {
                    if (fn && $.isFunction(fn)) {
                        fn.call(node, response)
                    }
                }
            }, $.etcd.request.buildTokenHeader(serverInfo))
        });
    },
    execute: function (serverInfo, cmd) {
        if ($.extends.isEmpty(serverInfo)) {
            $.app.show('连接节点信息不存在，请关闭连接后重新连接');
            // cmd.call(serverInfo, {});
        } else {
            let node = serverInfo

            if (node.authorized_enabled != '1') {
                cmd.call(serverInfo, node);
            } else {
                if ($.extends.isEmpty(node.node_token)) {
                    $.etcd.request.connect(node, function (data) {
                        if (data.status == 0) {
                            serverInfo.node_token = data.token;
                            cmd.call(serverInfo, node);
                        } else {
                            $.app.show("连接etcd服务器失败, " + data.resp_msg)
                        }
                    });
                } else {
                    cmd.call(serverInfo, node);
                }
            }
        }
    },
    echo: function (serverInfo, fn) {
        let url = V3_ENDPOINT.format2(serverInfo) + APIS.V3_ECHO;
        let data = {};
        data.count_only = true;
        data.key = Base64.encode('/test/');

        $.etcd.postJson(url, data, function (response) {
            fn.call(serverInfo, response)
        }, $.etcd.request.buildTokenHeader(serverInfo))
    },
    connect: function (serverInfo, fn, progressing) {
        let data = null;
        let url = null;

        if (serverInfo.authorized_enabled) {
            console.log("authorized_enabled is enabled")
            url = V3_ENDPOINT.format2(serverInfo) + APIS.V3_AUTH
            data = {};
            data.name = serverInfo.node_username;
            data.password = serverInfo.node_password;
        } else {
            console.log("authorized_enabled is disabled")
            url = V3_ENDPOINT.format2(serverInfo) + APIS.V3_ECHO
            data = {};
            data.count_only = true;
            data.key = Base64.encode('/test/');
        }

        console.log(serverInfo)

        $.etcd.postJson(url, data, function (response) {
            if (response.status == 0) {
                if (serverInfo.authorized_enabled == '1') {
                    if ($.etcd.callback.authorizeRefreshed) {
                        $.etcd.callback.authorizeRefreshed.call(serverInfo, response.token, response)
                    }
                }
                //saveAuthorization(etcdID, data.token);
            }

            if (fn)
                fn.call(serverInfo, response)
            console.log(response)
        }, null, progressing)
    },
    watch: {
        watch: function (fn, serverInfo, watchId, key, range_end, withPrefix, prev_kv, fragment, progress_notify, start_revision, overFn) {
            let request = {};
            let data = {};

            if (!$.extends.isEmpty(withPrefix) && withPrefix) {
                data['range_end'] = Base64.encode($.etcd.request.prefixFormat(key));
            } else {
                if (!$.extends.isEmpty(range_end))
                    data['range_end'] = Base64.encode(range_end);
            }

            data['key'] = Base64.encode(key);

            if (!$.extends.isEmpty(fragment))
                data['fragment'] = true;

            if (!$.extends.isEmpty(progress_notify))
                data['progress_notify'] = true;

            if (!$.extends.isEmpty(prev_kv))
                data['prev_kv'] = true;

            if (!$.extends.isEmpty(start_revision))
                data['start_revision'] = start_revision;


            if (!$.extends.isEmpty(watchId))
                data['watchId'] = watchId;


            request.create_request = data

            $.etcd.request.ajaxStream(serverInfo, V3_ENDPOINT.format2(serverInfo) + APIS.V3_WATCH_WATCH, request, function (xhr, state, chuck) {
                let json = null;

                try {
                    if (!$.extends.isEmpty(chuck)) {
                        json = $.extends.json.toobject2(chuck)
                    }
                } catch (e) {
                    console.error(e)
                }

                if (json != null) {
                    if ($.extends.isEmpty(json.error) && $.extends.isEmpty(json.result.cancel_reason)) {
                        if (fn)
                            fn(json, xhr, state)
                    } else {
                        if (!$.extends.isEmpty(json.error)) {
                            $.app.show("接收数据流失败：" + json.error)
                        } else {
                            $.app.show("接收数据流失败：" + json.result.cancel_reason)
                        }

                    }
                } else {
                    console.log(xhr);
                    console.log(chuck);
                }
            }, {
                success: function (result, status, xhr) {
                    if (overFn) {
                        overFn(xhr, status, result)
                    }
                },
                error: function (xhr, status) {
                    if (overFn) {
                        overFn(xhr, status, null)
                    }
                },
                complete1: function (xhr, status) {
                    if (overFn) {
                        overFn(xhr, status, null)
                    }
                }
            })

        },
        stop: function (fn, serverInfo, watchId) {
            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};
                data.cancel_request = {};
                data.cancel_request.watch_id = watchId;

                $.etcd.request.ajaxStream(serverInfo,
                    V3_ENDPOINT.format2(serverInfo) + APIS.V3_WATCH_WATCH, data, function (xhr, state, chuck) {
                        let json = null;

                        try {
                            if (!$.extends.isEmpty(chuck)) {
                                json = $.extends.json.toobject2(chuck)
                            }
                        } catch (e) {
                            console.error(e)
                        }

                        fn(json, xhr, state)
                    })
            });
        }
    },
    lock: {
        unlock: function (fn, serverInfo, key, leaseid) {

            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};
                data.ID = leaseid;
                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_LEASE_REVOKE, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if (response && response.code) {
                        $.app.show('强制解锁失败:' + response.error + ', 可能锁的状态已经改变，请刷新数据后重试.');
                        return;
                    }

                    if (fn && $.isFunction(fn)) {
                        fn.call(node, response)
                    }

                }, $.etcd.request.buildTokenHeader(serverInfo))
            })

            // $.etcd.request.lease.revoke(function (response){
            //     if(fn && $.isFunction(fn)){
            //         fn.call(node, response)
            //     }
            // }, serverInfo, leaseid);
        },
        lockinfo: function (fn, serverInfo, key) {
            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.request.kv.range(function (response) {

                        response.kvs = response.kvs || [];

                        let list = $.extends.collect(response.kvs, function (v) {
                            return $.extends.json.toobject2(v.value)
                        });

                        response.requests = list;
                        response.count = list.length;
                        delete response.kvs;

                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }

                    }, node, ETC4GO_LOCK_REQUEST_INFO_PREFIX.format2({key: key}),
                    null, true);
            });
        },
        list: function (fn, serverInfo, skip, count, key, sort_order, sort_target) {

            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.request.kv.range(function (response) {
                    response.kvs = response.kvs || [];

                    let allT = response.kvs.length;

                    let list = []

                    for (let idx = 0; idx < allT; idx++) {
                        if (!$.extends.isEmpty(key)) {
                            if (response.kvs[idx].key.indexOf(key) < 0)
                                continue;
                        }
                        let obj = $.extend({}, response.kvs[idx]);
                        obj.value = $.extends.json.toobject2(response.kvs[idx].value);
                        obj.key = obj.key.replace(ETC4GO_LOCK_INFO_FORMAT, '');

                        $.extend(obj, obj.value);
                        delete obj.value;
                        list.push(obj)
                    }

                    if (sort_order != 'KEY') {
                        list = list.sort(function (a, b) {
                            return a > b ? 1 : -1;
                        })
                    }

                    let limit = 0;

                    if (skip == null || skip <= 0)
                        skip = 0;

                    if (count == null || count <= 0) {
                        limit = response.leases.length
                    } else {
                        limit = skip + count
                    }

                    limit = limit > list.length ? list.length : limit;
                    let total = list.length;

                    response.kvs = list;

                    list = [];

                    for (let idx = skip; idx < limit; idx++) {
                        list.push(response.kvs[idx])
                    }

                    response.ids = list;
                    delete response.kvs;

                    response.total = total;

                    if (fn && $.isFunction(fn)) {
                        fn.call(node, response)
                    }


                }, serverInfo, ETC4GO_LOCK_INFO_PREFIX, null, true, false, sort_order, 'KEY', 0, 0)
            });

        }
    },
    lease: {
        grant: function (fn, serverInfo, leaseid, ttl) {

            let data = {};

            if (leaseid == null || leaseid <= 0)
                data.ID = 0 + '';
            else
                data.ID = leaseid + '';

            if (ttl == null || ttl <= 0)
                data.TTL = '60'
            else
                data.TTL = ttl + '';

            data.ID = leaseid;

            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_LEASE_GRANT, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }
                    }

                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        keepalive: function (fn, serverInfo, leaseid) {

            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};
                data.ID = leaseid;
                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_LEASE_KEEPALIVE, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }
                    }

                }, $.etcd.request.buildTokenHeader(serverInfo))
            })
        },
        keepAliveBulk: function (fn, serverInfo, leaseids) {

            leaseids = leaseids || [];

            let o = leaseids.length;
            let ok = [];
            let fail = [];

            $.etcd.request.execute(serverInfo, function (node) {

                $.app.showProgress('批量续约租约中......')

                $.each(leaseids, function (idx, lease) {

                    let data = {};
                    data.ID = lease;

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_LEASE_KEEPALIVE, data, function (response) {

                        if ($.etcd.response.retoken(serverInfo, response)) {
                            fail.push(lease);
                        } else {
                            if ($.etcd.response.check(response)) {
                                ok.push(lease)
                            } else {
                                fail.push(lease);
                            }
                        }

                        if (idx >= o - 1) {
                            response.ok = ok;
                            response.fail = fail;

                            if (fn && $.isFunction(fn)) {
                                fn.call(node, response)
                                $.app.closeProgess()
                            }
                        }

                    }, $.etcd.request.buildTokenHeader(serverInfo))
                })

            })
        },
        revoke: function (fn, serverInfo, leaseid) {

            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};
                data.ID = leaseid;
                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_LEASE_REVOKE, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }
                    }

                }, $.etcd.request.buildTokenHeader(serverInfo))
            })
        },
        revokeBulk: function (fn, serverInfo, leaseids) {

            leaseids = leaseids || [];

            let o = leaseids.length;
            let ok = [];
            let fail = [];

            $.etcd.request.execute(serverInfo, function (node) {

                $.app.showProgress('批量删除租约中......')

                $.each(leaseids, function (idx, lease) {

                    let data = {};
                    data.ID = lease;

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_LEASE_REVOKE, data, function (response) {

                        if ($.etcd.response.retoken(serverInfo, response)) {
                            fail.push(lease);
                        } else {
                            if ($.etcd.response.check(response)) {
                                ok.push(lease)
                            } else {
                                fail.push(lease);
                            }
                        }

                        if (idx >= o - 1) {
                            response.ok = ok;
                            response.fail = fail;

                            if (fn && $.isFunction(fn)) {
                                fn.call(node, response)
                                $.app.closeProgess()
                            }
                        }

                    }, $.etcd.request.buildTokenHeader(serverInfo))
                })

            })
        },
        timetolive: function (fn, serverInfo, leaseid) {
            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};
                data.ID = leaseid;
                data.keys = true;

                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_LEASE_TIMETOLIVE, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {

                        if ($.extends.isEmpty(response['grantedTTL'])) {
                            response.valid = false;
                        } else {
                            response.valid = true;
                        }

                        if ($.extends.isEmpty(response['grantedTTL']) || response['grantedTTL'] == '-1') {
                            response.timeout = true;
                        } else {
                            response.timeout = false;
                        }

                        if (response.keys) {
                            $.each(response.keys, function (idx, v) {
                                response.keys[idx] = Base64.decode(v)
                            })
                        }

                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo));
            })
        },
        lease: function (fn, serverInfo, skip, count, key) {
            $.etcd.request.execute(serverInfo, function (node) {

                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_LEASE_ALL, {}, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {

                        let total = 0;
                        let ids = [];

                        if (response.leases != null) {
                            if (!$.extends.isEmpty(key)) {
                                let newLeases = [];

                                $.each(response.leases, function (idx, val) {
                                    if (val.ID.endsWith(key)) {
                                        newLeases.push(val)
                                    }
                                })
                                response.leases = newLeases;
                            }

                            total = response.leases.length

                            let limit = 0;

                            if (skip == null || skip <= 0)
                                skip = 0;

                            if (count == null || count <= 0) {
                                limit = response.leases.length
                            } else {
                                limit = skip + count
                            }

                            limit = limit > response.leases.length ? response.leases.length : limit;

                            for (let idx = skip; idx < limit; idx++) {
                                ids.push(response.leases[idx])
                            }

                            delete response.leases;
                        }


                        response.ids = ids;
                        response.total = total;

                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }
                    }

                }, $.etcd.request.buildTokenHeader(serverInfo));
            });
        }
    },
    kv: {
        del: function (fn, serverInfo, key, withPrefix) {
            let data = {};
            data['key'] = Base64.encode(key);
            data['prev_kv'] = false;

            if (withPrefix) {
                data['range_end'] = Base64.encode($.etcd.request.prefixFormat(key));
            }

            $.etcd.request.execute(serverInfo, function (node) {

                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_RANGE_DEL, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }
                    }

                }, $.etcd.request.buildTokenHeader(serverInfo));

            });
        },
        put: function (fn, serverInfo, key, value, leaseid, ignore_value, ignore_lease, ttl) {

            let data = {};

            data['key'] = Base64.encode(key);
            data['value'] = Base64.encode(value);

            if (!$.extends.isEmpty(leaseid)) {
                data['lease'] = leaseid
            }

            if (ignore_lease) {
                data['ignore_lease'] = true;
                delete data['lease'];
            }

            if (ignore_value) {
                data['ignore_value'] = true;
                delete data['value'];
            }

            data['prev_kv'] = false;

            $.etcd.request.execute(serverInfo, function (node) {

                let putFn = function () {
                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_RANGE_PUT, data, function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {
                            if (fn && $.isFunction(fn)) {
                                fn.call(node, response)
                            }
                        }

                    }, $.etcd.request.buildTokenHeader(serverInfo));
                }

                if ($.extends.isEmpty(leaseid) && ttl != null && ttl > 0) {
                    $.etcd.request.lease.grant(function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {
                            data['lease'] = response.ID;
                            putFn();
                        }
                    }, serverInfo, null, ttl)
                } else {
                    putFn();
                }


            });
        },
        range: function (fn, serverInfo, key, range, withPrefix, count_only, sort_order, sort_target, skip, count,
                         min_create_revision, min_mod_revision, max_create_revision, max_mod_revision, key_only, ignore_key) {
            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};

                data['key'] = Base64.encode(key);
                if (!$.extends.isEmpty(withPrefix) && withPrefix) {
                    data['range_end'] = Base64.encode($.etcd.request.prefixFormat(key));
                } else {
                    if (!$.extends.isEmpty(range))
                        data['range_end'] = Base64.encode(range);
                }

                if (!$.extends.isEmpty(sort_order)) {
                    data['sort_order'] = sort_order;
                } else {
                    data['sort_order'] = 'NONE';
                }

                if (!$.extends.isEmpty(sort_target))
                    data['sort_target'] = sort_target;

                if (!$.extends.isEmpty(count_only) && count_only)
                    data['count_only'] = true;

                if (!$.extends.isEmpty(min_create_revision))
                    data['min_create_revision'] = Number(min_create_revision);

                if (!$.extends.isEmpty(min_mod_revision))
                    data['min_mod_revision'] = Number(min_mod_revision);

                if (!$.extends.isEmpty(max_create_revision))
                    data['max_create_revision'] = Number(max_create_revision);

                if (!$.extends.isEmpty(max_mod_revision))
                    data['max_mod_revision'] = Number(max_mod_revision);

                if (!$.extends.isEmpty(key_only) && key_only)
                    data['keys_only'] = true;

                if (!$.extends.isEmpty(ignore_key) && ignore_key) {
                    data['key'] = Base64.encode('\0');
                    data['range_end'] = Base64.encode('\0');
                }

                let limit = null;

                if (skip == null || skip <= 0)
                    skip = 0;


                if (count == null || count <= 0) {
                    limit = null
                } else {
                    limit = skip + count
                }

                if (limit != null)
                    data['limit'] = Number(limit);

                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_RANGE, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {

                        if (response.kvs == null) {
                            response.kvs = [];
                        }

                        if (response.count == null) {
                            response.count = response.kvs.length;
                        }

                        let kvs = [];
                        let endIndex = 0;

                        if (count == null || count <= 0)
                            endIndex = response.kvs.length;
                        else {
                            endIndex = response.kvs.length > (skip + count) ? (skip + count) : response.kvs.length;
                        }

                        for (let idx = skip; idx < endIndex; idx++) {
                            kvs.push(response.kvs[idx])
                        }

                        if (fn && $.isFunction(fn)) {
                            response.kvs = $.etcd.response.decodeKvs(kvs);
                            fn.call(node, response)
                        }
                    }

                    // $.app.show(response)
                }, $.etcd.request.buildTokenHeader(serverInfo))
            })
        }
    },
    auth: {
        status: function (fn, serverInfo) {
            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_STATUS, {}, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        enable: function (fn, serverInfo) {
            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_ENABLE, {}, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        disable: function (fn, serverInfo) {
            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_DISABLE, {}, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        user_list: function (fn, serverInfo) {
            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_USER_LIST, {}, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {

                        if (fn && $.isFunction(fn)) {
                            response.users = response.users || [];
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        role_list: function (fn, serverInfo) {
            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_ROLE_LIST, {}, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            response.roles = response.roles || [];
                            fn.call(node, response)
                        }
                    }

                    // $.app.show(response)
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        user: {
            list: function (fn, serverInfo) {
                return $.etcd.request.auth.user_list(fn, serverInfo);
            },
            get: function (fn, serverInfo, username) {
                $.etcd.request.execute(serverInfo, function (node) {
                    let data = {};

                    data.name = username;

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_USER_GET, data, function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {

                            response.roles = response.roles || [];

                            response.count = response.roles.length;

                            let roles = [];

                            $.each(response.roles, function (idx, v) {
                                roles.push({
                                    "name": v
                                })
                            });

                            response.roles = roles;

                            fn.call(node, response)
                        }
                    }, $.etcd.request.buildTokenHeader(serverInfo))
                });
            },
            add: function (fn, serverInfo, username, pwd) {
                $.etcd.request.execute(serverInfo, function (node) {
                    let data = {};

                    if ($.extends.isEmpty(pwd)) {
                        data.password = '';
                        data.options = {
                            no_password: true
                        }
                    } else {
                        data.password = pwd;
                        data.hashedPassword = Math.uuid()
                        data.options = {
                            no_password: false
                        }
                    }

                    data.name = username;

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_USER_ADD, data, function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {
                            if (fn && $.isFunction(fn)) {
                                fn.call(node, response)
                            }
                        }
                    }, $.etcd.request.buildTokenHeader(serverInfo))
                });
            },
            delete: function (fn, serverInfo, username) {
                $.etcd.request.execute(serverInfo, function (node) {
                    let data = {};

                    data.name = username;

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_USER_DELETE, data, function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {
                            if (fn && $.isFunction(fn)) {
                                fn.call(node, response)
                            }
                        }
                    }, $.etcd.request.buildTokenHeader(serverInfo))
                });
            },
            change_password: function (fn, serverInfo, username, pwd) {
                $.etcd.request.execute(serverInfo, function (node) {
                    let data = {};

                    data.password = pwd;
                    data.name = username;
                    data.hashedPassword = Math.uuid()

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_USER_CHNAGEPW, data, function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {
                            if (fn && $.isFunction(fn)) {
                                fn.call(node, response)
                            }
                        }
                    }, $.etcd.request.buildTokenHeader(serverInfo))
                });
            },
            revoke: function (fn, serverInfo, username, rolename) {
                $.etcd.request.execute(serverInfo, function (node) {
                    let data = {};

                    data.role = rolename;
                    data.name = username;

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_USER_REVOKE, data, function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {
                            if (fn && $.isFunction(fn)) {
                                fn.call(node, response)
                            }
                        }
                    }, $.etcd.request.buildTokenHeader(serverInfo))
                });
            },
            grant: function (fn, serverInfo, username, rolename) {
                $.etcd.request.execute(serverInfo, function (node) {
                    let data = {};

                    data.role = rolename;
                    data.user = username;

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_USER_GRANT, data, function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {
                            if (fn && $.isFunction(fn)) {
                                fn.call(node, response)
                            }
                        }
                    }, $.etcd.request.buildTokenHeader(serverInfo))
                });
            },
        },
        role: {
            list: function (fn, serverInfo) {
                return $.etcd.request.auth.role_list(fn, serverInfo);
            },
            get: function (fn, serverInfo, rolename) {
                $.etcd.request.execute(serverInfo, function (node) {
                    let data = {};

                    data.role = rolename;

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_ROLE_GET, data, function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {
                            if (fn && $.isFunction(fn)) {
                                response.perm = response.perm || [];

                                response.count = response.perm.length;

                                let perm = [];

                                $.each(response.perm, function (idx, v) {
                                    perm.push({
                                        "permType": $.extends.isEmpty(v.permType) ? 'READ' : v.permType,
                                        "key": Base64.decode(v.key),
                                        "range_end": $.extends.isEmpty(v.range_end) ? '' : Base64.decode(v.range_end),
                                    })
                                });

                                response.perm = perm;

                                fn.call(node, response)
                            }
                        }
                    }, $.etcd.request.buildTokenHeader(serverInfo))
                });
            },
            add: function (fn, serverInfo, rolename) {
                $.etcd.request.execute(serverInfo, function (node) {
                    let data = {};
                    data.name = rolename;

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_ROLE_ADD, data, function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {
                            if (fn && $.isFunction(fn)) {
                                fn.call(node, response)
                            }
                        }
                    }, $.etcd.request.buildTokenHeader(serverInfo))
                });
            },
            delete: function (fn, serverInfo, rolename) {
                $.etcd.request.execute(serverInfo, function (node) {
                    let data = {};

                    data.role = rolename;

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_ROLE_DELETE, data, function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {
                            if (fn && $.isFunction(fn)) {
                                fn.call(node, response)
                            }
                        }
                    }, $.etcd.request.buildTokenHeader(serverInfo))
                });
            },
            grant: function (fn, serverInfo, rolename, key, range_end, permType) {
                $.etcd.request.execute(serverInfo, function (node) {
                    let data = {};

                    data.key = Base64.encode(key)

                    if (!$.extends.isEmpty(range_end)) {
                        data.range_end = Base64.encode(range_end)
                    }

                    if (!$.extends.isEmpty(permType)) {
                        data.permType = permType
                    } else {
                        data.permType = 'READWRITE'
                    }

                    let perm = data;
                    data = {}
                    data.name = rolename;
                    data.perm = perm;


                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_ROLE_GRANT, data, function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {
                            if (fn && $.isFunction(fn)) {
                                fn.call(node, response)
                            }
                        }
                    }, $.etcd.request.buildTokenHeader(serverInfo))
                });
            },
            revoke: function (fn, serverInfo, rolename, key, range_end) {
                $.etcd.request.execute(serverInfo, function (node) {
                    let data = {};

                    data.role = rolename;
                    data.key = Base64.encode(key)

                    if (!$.extends.isEmpty(range_end)) {
                        data.range_end = Base64.encode(range_end)
                    }

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_AUTH_ROLE_REVOKE, data, function (response) {
                        if ($.etcd.response.retoken(serverInfo, response))
                            return;

                        if ($.etcd.response.check(response)) {
                            if (fn && $.isFunction(fn)) {
                                fn.call(node, response)
                            }
                        }
                    }, $.etcd.request.buildTokenHeader(serverInfo))
                });
            },
        }
    },
    cluster: {
        member_list: function (fn, serverInfo) {
            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_CLUSTER_MEMBER_LIST, {}, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            response.members = response.members || [];
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        member_promote: function (fn, serverInfo, memberId) {

            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};
                data.ID = memberId;

                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_CLUSTER_MEMBER_PROMOTE, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            response.members = response.members || [];
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        member_update: function (fn, serverInfo, memberId, peerURLs) {
            if (peerURLs == null || $.extends.isEmpty(peerURLs) || peerURLs.length == 0) {
                $.app.show('通信节点不能为空');
                return false;
            }

            if (typeof peerURLs == 'string') {
                peerURLs = peerURLs.split(",")
            }

            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};
                data.peerURLs = peerURLs;
                data.ID = memberId;

                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_CLUSTER_MEMBER_UPDATE, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            response.members = response.members || [];
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        member_remove: function (fn, serverInfo, memberId) {

            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};
                data.ID = memberId;

                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_CLUSTER_MEMBER_REMOVE, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            response.members = response.members || [];
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        member_add: function (fn, serverInfo, peerURLs, isLearner) {
            if (peerURLs == null || $.extends.isEmpty(peerURLs) || peerURLs.length == 0) {
                $.app.show('通信节点不能为空');
                return false;
            }

            if (typeof peerURLs == 'string') {
                peerURLs = peerURLs.split(",")
            }

            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};
                data.peerURLs = peerURLs;

                if (isLearner) {
                    data.isLearner = true;
                } else {
                    data.isLearner = false;
                }

                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_CLUSTER_MEMBER_ADD, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            response.members = response.members || [];
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        }
    },
    maintenance: {
        version: function (fn, serverInfo) {
            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.getJson(V3_ENDPOINT.format2(node) + APIS.V3_MAINTEANCE_VERSION, {}, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        status: function (fn, serverInfo) {
            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_MAINTEANCE_STATUS, {}, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        transfer: function (fn, serverInfo, targetId) {

            let data = {}
            data.targetID = targetId;

            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + APIS.V3_MAINTEANCE_TRANSFER, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if ($.etcd.response.check(response)) {
                        if (fn && $.isFunction(fn)) {
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        snapshot: function (fn, serverInfo, overFn) {

            $.etcd.request.ajaxStream(serverInfo, V3_ENDPOINT.format2(serverInfo) + APIS.V3_MAINTEANCE_SNAPSHOT,
                {}, function (xhr, state, chuck) {
                    if (fn)
                        fn(chuck, xhr, state)
                }, {
                    success: function (result, status, xhr) {
                        if (overFn) {
                            overFn(xhr, status, result)
                        }
                    },
                    error: function (xhr, status) {
                        if (overFn) {
                            overFn(xhr, status, null)
                        }
                    }
                });

        }
    }
};

$.etcd.response = {
    check: function (response) {
        if (response && response.code == 16) {
            $.app.show('连接已经失效或者错误，请重新进行请求');
            return false;
        } else if (response && response.code) {
            $.app.show('服务器错误信息:' + response.error);
            return false;
        } else if (response.status < 0) {
            $.app.show('服务器错误信息:服务器响应错误，请确定服务器响应正确后再尝试');
            return false;
        }

        return true
    },
    retoken: function (serverInfo, response) {
        if (response && response.code == 16) {
            $.etcd.request.connect(serverInfo, null, '连接已经失效或者错误，正在重新建立连接。')
            $.app.show('连接已经失效或者错误，正在重新建立连接。');

            return true;
        }

        return false;
    },
    getClusterId: function (header) {
        if (header == null) {
            return '';
        }
        return $.extends.isEmpty(header['cluster_id'], '');
    },

    getMemberId: function (header) {
        if (header == null) {
            return '';
        }

        return $.extends.isEmpty(header['member_id'], '');
    },

    getLastRevision: function (header) {
        if (header == null) {
            return '';
        }

        return $.extends.isEmpty(header['revision'], '');
    },
    getRaftTerm: function (header) {
        if (header == null) {
            return '';
        }
        return $.extends.isEmpty(header['raft_term'], '');
    },
    decodeKvs: function (kvs) {
        let rtn = [];

        if (!$.extends.isEmpty(kvs)) {
            $.each(kvs, function (idx, v) {
                let o = $.extend({}, v);
                if (v.key)
                    o.key = Base64.decode(v.key);
                else
                    o.key = '';

                o.id = v.key;

                if (v.value)
                    o.value = Base64.decode(v.value);
                else
                    o.value = '';

                rtn.push(o);
            })
        }

        return rtn;
    }

}