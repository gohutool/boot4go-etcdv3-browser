let V3_ENDPOINT = 'http://{node_host}:{node_port}'

let V3_MTN = '/v3/maintenance/status'
let V3_ECHO = '/v3/kv/range'
let V3_AUTH = '/v3/auth/authenticate'
let V3_VERSION = '/version'

let V3_AUTH_USER_LIST = '/v3/auth/user/list'
let V3_AUTH_ROLE_LIST = '/v3/auth/role/list'


let V3_CLUSTER_MEMBER_LIST = '/v3/cluster/member/list'


let V3_RANGE = '/v3/kv/range'
let V3_RANGE_DEL = '/v3/kv/deleterange'
let V3_RANGE_PUT = '/v3/kv/put'

let V3_LEASE_ALL = '/v3/kv/lease/leases'
let V3_LEASE_TIMETOLIVE = '/v3/kv/lease/timetolive'
let V3_LEASE_REVOKE = '/v3/kv/lease/revoke'
let V3_LEASE_GRANT = '/v3/lease/grant'
let V3_LEASE_KEEPALIVE = '/v3/lease/keepalive'


// function
$.app.beforeRequest = function (options){
    console.log("$.app.beforeRequest")

    if(options.headers && options.headers.isetcd){
        //let data = options.data;
        options.isetcd = options.headers.isetcd

        delete options.headers.Authorization

        if(!$.extends.isEmpty(options.headers.token)){
            options.headers.Authorization = options.headers.token

        }

        delete options.headers.isetcd
        delete options.headers.uid
        delete options.headers.token
    }

    console.log(options)
}

$.app.afterSuccess = function (options, response){

    if (options.headers.isetcd || response.xhr.getResponseHeader("Grpc-Metadata-Content-Type") == "application/grpc"){
        let data = response.data

        if(data && typeof data == 'object'){
            data.status = 0
            response.data = data
        }else{
        }
    }

    console.log("$.app.afterSuccess")
    console.log(response)
}

$.app.afterError = function (options, response){
    console.log("$.app.afterError")
    console.log(response)
}

$.etcd = {}

$.etcd.postJson = function(url, datastr, fn, requestHeader, progressing){

    if(requestHeader == null){
        requestHeader = {};
    }

    requestHeader.isetcd = true

    if(typeof datastr == 'object'){
        datastr = $.extends.json.tostring(datastr)
    }

    requestHeader['Content-Type'] = 'application/json; charset=UTF-8';

    $.app.ajax(url, datastr, 'POST', "json", fn, true, progressing, requestHeader);
};

$.etcd.callback = {
    authorizeRefreshed : function (token,response){
    },
    tokenInvalid: function (){
    }
}

$.etcd.request = {
    prefixFormat :function (prefix){
        if($.extends.isEmpty(prefix))
            return prefix;

        if(prefix.length==1){
            return String.fromCharCode(prefix.charCodeAt(0)+1)
        }else{
            return prefix.substring(0, prefix.length-1) + String.fromCharCode(prefix.charCodeAt(prefix.length-1)+1)
        }
    },
    buildTokenHeader: function(serverInfo) {
        if(serverInfo.authorized_enabled!='1'){
            return {};
        }

        return {"token":serverInfo.node_token};
    },
    execute: function(serverInfo, cmd){
        if($.extends.isEmpty(serverInfo)){
            cmd.call(serverInfo, {});
        }else{
            let node = serverInfo

            if(node.authorized_enabled!='1'){
                cmd.call(serverInfo, node);
            }else{
                if($.extends.isEmpty(node.node_token)){
                    $.etcd.request.connect(node, function (data) {
                        if(data.status ==0 ){
                            serverInfo.node_token = data.token;
                            cmd.call(serverInfo, node);
                        }else{
                            $.app.show("连接etcd服务器失败, " + data.resp_msg)
                        }
                    });
                }else{
                    cmd.call(serverInfo, node);
                }
            }
        }
    },
    echo:function(serverInfo, fn){
        let url = V3_ENDPOINT.format2(serverInfo) + V3_ECHO;
        let data = {};
        data.count_only = true;
        data.key = Base64.encode('/test/');

        $.etcd.postJson(url, data, function (response) {
            fn.call(serverInfo, response)
        }, $.etcd.request.buildTokenHeader(serverInfo))
    },
    connect: function(serverInfo, fn, progressing){
        let data = null;
        let url = null;

        if(serverInfo.authorized_enabled){
            console.log("authorized_enabled is enabled")
            url = V3_ENDPOINT.format2(serverInfo) + V3_AUTH
            data = {};
            data.name = serverInfo.node_username;
            data.password = serverInfo.node_password;
        }else{
            console.log("authorized_enabled is disabled")
            url = V3_ENDPOINT.format2(serverInfo) + V3_ECHO
            data = {};
            data.count_only = true;
            data.key = Base64.encode('/test/');
        }

        console.log(serverInfo)

        $.etcd.postJson(url, data, function (response) {
            if(response.status ==0 ){
                if(serverInfo.authorized_enabled=='1'){
                    if($.etcd.callback.authorizeRefreshed){
                        $.etcd.callback.authorizeRefreshed.call(serverInfo, response.token, response)
                    }
                }
                //saveAuthorization(etcdID, data.token);
            }

            if(fn)
                fn.call(serverInfo, response)
            console.log(response)
        }, null, progressing)
    },
    lease:{
        grant: function(fn, serverInfo, leaseid, ttl){

            let data = {};

            if(leaseid==null || leaseid<=0)
                data.ID = 0+'';
            else
                data.ID = leaseid+'';

            if(ttl==null || ttl<=0)
                data.TTL = '60'
            else
                data.TTL = ttl+'';

            data.ID = leaseid;

            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_LEASE_GRANT, data, function (response) {
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
        keepalive: function(fn, serverInfo, leaseid){

            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};
                data.ID = leaseid;
                $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_LEASE_KEEPALIVE, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if($.etcd.response.check(response)){
                        if(fn && $.isFunction(fn)){
                            fn.call(node, response)
                        }
                    }

                }, $.etcd.request.buildTokenHeader(serverInfo))
            })
        },
        keepAliveBulk: function(fn, serverInfo, leaseids){

            leaseids = leaseids||[];

            let o = leaseids.length;
            let ok = [];
            let fail = [];

            $.etcd.request.execute(serverInfo, function (node) {

                $.app.showProgress('批量续约租约中......')

                $.each(leaseids, function (idx, lease){

                    let data = {};
                    data.ID = lease;

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_LEASE_KEEPALIVE, data, function (response) {

                        if ($.etcd.response.retoken(serverInfo, response)){
                            fail.push(lease);
                        }else{
                            if($.etcd.response.check(response)){
                                ok.push(lease)
                            }else{
                                fail.push(lease);
                            }
                        }

                        if(idx >= o - 1){
                            response.ok = ok;
                            response.fail = fail;

                            if(fn && $.isFunction(fn)){
                                fn.call(node, response)
                                $.app.closeProgess()
                            }
                        }

                    }, $.etcd.request.buildTokenHeader(serverInfo))
                })

            })
        },
        revoke: function(fn, serverInfo, leaseid){

            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};
                data.ID = leaseid;
                $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_LEASE_REVOKE, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if($.etcd.response.check(response)){
                        if(fn && $.isFunction(fn)){
                            fn.call(node, response)
                        }
                    }

                }, $.etcd.request.buildTokenHeader(serverInfo))
            })
        },
        revokeBulk: function(fn, serverInfo, leaseids){

            leaseids = leaseids||[];

            let o = leaseids.length;
            let ok = [];
            let fail = [];

            $.etcd.request.execute(serverInfo, function (node) {

                $.app.showProgress('批量删除租约中......')

                $.each(leaseids, function (idx, lease){

                    let data = {};
                    data.ID = lease;

                    $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_LEASE_REVOKE, data, function (response) {

                        if ($.etcd.response.retoken(serverInfo, response)){
                          fail.push(lease);
                        }else{
                            if($.etcd.response.check(response)){
                                ok.push(lease)
                            }else{
                                fail.push(lease);
                            }
                        }

                        if(idx >= o - 1){
                            response.ok = ok;
                            response.fail = fail;

                            if(fn && $.isFunction(fn)){
                                fn.call(node, response)
                                $.app.closeProgess()
                            }
                        }

                    }, $.etcd.request.buildTokenHeader(serverInfo))
                })

            })
        },
        timetolive: function(fn, serverInfo, leaseid){
            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};
                data.ID = leaseid;
                data.keys = true;

                $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_LEASE_TIMETOLIVE, data, function (response) {
                    if ($.etcd.response.retoken(serverInfo, response))
                        return;

                    if($.etcd.response.check(response)){

                        if($.extends.isEmpty(response['grantedTTL'])){
                            response.valid = false;
                        }else{
                            response.valid = true;
                        }

                        if($.extends.isEmpty(response['grantedTTL']) || response['grantedTTL']=='-1'){
                            response.timeout = true;
                        }else{
                            response.timeout = false;
                        }

                        if(response.keys){
                            $.each(response.keys, function (idx,v) {
                                response.keys[idx] = Base64.decode(v)
                            })
                        }

                        if(fn && $.isFunction(fn)){
                            fn.call(node, response)
                        }
                    }
                }, $.etcd.request.buildTokenHeader(serverInfo));
            })
        },
        lease:function(fn, serverInfo, skip, count, key){
            $.etcd.request.execute(serverInfo, function (node) {

                $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_LEASE_ALL, {}, function (response) {
                    if($.etcd.response.retoken(serverInfo,response))
                        return ;

                    if($.etcd.response.check(response)){

                        let total = 0;
                        let ids = [];

                        if(response.leases!=null){
                            if(!$.extends.isEmpty(key)){
                                let newLeases = [];
                                
                                $.each(response.leases, function (idx, val) {
                                    if(val.ID.endsWith(key)){
                                        newLeases.push(val)
                                    }
                                })
                                response.leases = newLeases;
                            }

                            total = response.leases.length

                            let limit = 0;

                            if (skip == null || skip <=0)
                                skip = 0;

                            if (count == null || count <=0){
                                limit = response.leases.length
                            }else{
                                limit = skip + count
                            }

                            limit = limit>response.leases.length?response.leases.length:limit;

                            for(let idx = skip; idx < limit ; idx ++){
                                ids.push(response.leases[idx])
                            }

                            delete response.leases;
                        }


                        response.ids = ids;
                        response.total = total;

                        if(fn && $.isFunction(fn)){
                            fn.call(node, response)
                        }
                    }

                }, $.etcd.request.buildTokenHeader(serverInfo));
            });
        }
    },
    kv:{
        del:function (fn, serverInfo, key, withPrefix){
            let data = {};
            data['key']=Base64.encode(key);
            data['prev_kv']=false;

            if(withPrefix){
                data['range_end']=Base64.encode($.etcd.request.prefixFormat(key));
            }

            $.etcd.request.execute(serverInfo, function (node){

                $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_RANGE_DEL, data, function (response) {
                    if($.etcd.response.retoken(serverInfo,response))
                        return ;

                    if($.etcd.response.check(response)){
                        if(fn && $.isFunction(fn)){
                            fn.call(node, response)
                        }
                    }

                }, $.etcd.request.buildTokenHeader(serverInfo));

            });
        },
        put:function (fn, serverInfo, key, value, leaseid, ignore_value, ignore_lease){
            let data = {};

            data['key']=Base64.encode(key);
            data['value'] = Base64.encode(value);

            if(!$.extends.isEmpty(leaseid)){
                data['lease'] = leaseid
            }

            if(ignore_lease){
                data['ignore_lease']=true;
                delete data['lease'];
            }

            if(ignore_value){
                data['ignore_value']=true;
                delete data['value'];
            }

            data['prev_kv']=false;

            $.etcd.request.execute(serverInfo, function (node){

                $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_RANGE_PUT, data, function (response) {
                    if($.etcd.response.retoken(serverInfo,response))
                        return ;

                    if($.etcd.response.check(response)){
                        if(fn && $.isFunction(fn)){
                            fn.call(node, response)
                        }
                    }

                }, $.etcd.request.buildTokenHeader(serverInfo));

            });
        },
        range: function (fn, serverInfo, key, range, withPrefix, count_only, sort_order, sort_target, skip, count,
                         min_create_revision, min_mod_revision, max_create_revision, max_mod_revision, key_only, ignore_key){
            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};

                data['key']=Base64.encode(key);
                if(!$.extends.isEmpty(withPrefix)&&withPrefix){
                    data['range_end']=Base64.encode($.etcd.request.prefixFormat(key));
                }else{
                    if(!$.extends.isEmpty(range))
                        data['range_end']=Base64.encode(range);
                }

                if(!$.extends.isEmpty(sort_order)){
                    data['sort_order']=sort_order;
                }else{
                    data['sort_order']='NONE';
                }

                if(!$.extends.isEmpty(sort_target))
                    data['sort_target']=sort_target;

                if(!$.extends.isEmpty(count_only)&&count_only)
                    data['count_only']=true;

                if(!$.extends.isEmpty(min_create_revision))
                    data['min_create_revision']=Number(min_create_revision);

                if(!$.extends.isEmpty(min_mod_revision))
                    data['min_mod_revision']=Number(min_mod_revision);

                if(!$.extends.isEmpty(max_create_revision))
                    data['max_create_revision']=Number(max_create_revision);

                if(!$.extends.isEmpty(max_mod_revision))
                    data['max_mod_revision']=Number(max_mod_revision);

                if(!$.extends.isEmpty(key_only)&&key_only)
                    data['keys_only']=true;

                if(!$.extends.isEmpty(ignore_key)&&ignore_key){
                    data['key']=Base64.encode('\0');
                    data['range_end']=Base64.encode('\0');
                }

                let limit = null;

                if (skip == null || skip <=0)
                    skip = 0;


                if (count == null || count <=0){
                    limit = null
                }else{
                    limit = skip + count
                }

                if(limit!=null)
                    data['limit']=Number(limit);

                $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_RANGE, data, function (response) {
                    if($.etcd.response.retoken(serverInfo,response))
                        return ;

                    if($.etcd.response.check(response)){

                        if(response.kvs==null){
                            response.kvs = [];
                        }

                        if(response.count==null){
                            response.count = response.kvs.length;
                        }

                        let kvs = [];
                        let endIndex = 0;

                        if (count == null || count <=0)
                            endIndex = response.kvs.length;
                        else{
                            endIndex = response.kvs.length>(skip+count)?(skip+count):response.kvs.length;
                        }

                        for(let idx = skip; idx < endIndex; idx ++){
                            kvs.push(response.kvs[idx])
                        }

                        if(fn && $.isFunction(fn)){
                            response.kvs = $.etcd.response.decodeKvs(kvs);
                            fn.call(node, response)
                        }
                    }

                    // $.app.show(response)
                }, $.etcd.request.buildTokenHeader(serverInfo))
            })
        }
    },
    auth:{
        user_list: function (fn, serverInfo){
            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_AUTH_USER_LIST, {}, function (response) {
                    fn(node, response)
                    // $.app.show(response)
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        },
        role_list: function (fn, serverInfo){
            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_AUTH_ROLE_LIST, {}, function (response) {
                    fn(node, response)
                    // $.app.show(response)
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        }
    },
    cluster:{
        member_list:function (fn, serverInfo){
            $.etcd.request.execute(serverInfo, function (node) {
                $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_CLUSTER_MEMBER_LIST, {}, function (response) {
                    fn(node, response)
                    // $.app.show(response)
                }, $.etcd.request.buildTokenHeader(serverInfo))
            });
        }
    }
};

$.etcd.response = {
    check: function (response){
        if(response&&response.code==16){
            $.app.show('连接已经失效或者错误，请重新进行请求');
            return false;
        }else if(response&&response.code){
            $.app.show('服务器错误信息:'+response.error);
            return false;
        }

        return true
    },
    retoken:function(serverInfo, response){
        if(response&&response.code==16){
            $.etcd.request.connect(serverInfo, null, '连接已经失效或者错误，正在重新建立连接。')
            $.app.show('连接已经失效或者错误，正在重新建立连接。');

            return true;
        }

        return false;
    },
    getClusterId : function (header){
        if(header==null){
            return '';
        }
        return $.extends.isEmpty(header['cluster_id'], '');
    },

    getMemberId:function(header){
        if(header==null){
            return '';
        }

        return $.extends.isEmpty(header['member_id'], '');
    },

    getLastRevision: function(header){
        if(header==null){
            return '';
        }

        return $.extends.isEmpty(header['revision'], '');
    },
    getRaftTerm: function (header){
        if(header==null){
            return '';
        }
        return $.extends.isEmpty(header['raft_term'], '');
    },
    decodeKvs : function(kvs){
        let rtn = [];

        if(!$.extends.isEmpty(kvs)){
            $.each(kvs, function (idx, v) {
                let o = $.extend({}, v);
                if(v.key)
                    o.key = Base64.decode(v.key);
                else
                    o.key = '';

                o.id = v.key;

                if(v.value)
                    o.value = Base64.decode(v.value);
                else
                    o.value ='';

                rtn.push(o);
            })
        }

        return rtn;
    }

}