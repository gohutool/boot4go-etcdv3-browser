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
                data['lease'] = parseInt(leaseid)
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
                         min_create_revision, min_mod_revision){
            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};

                data['key']=Base64.encode(key);
                if(withPrefix){
                    data['range_end']=Base64.encode($.etcd.request.prefixFormat(key));
                }else{
                    if(range!=null)
                        data['range_end']=range;
                }

                if(sort_order!=null){
                    data['sort_order']=sort_order;
                }else{
                    data['sort_order']='NONE';
                }

                if(sort_target!=null)
                    data['sort_target']=sort_target;

                if(count_only)
                    data['count_only']=true;

                if(min_create_revision!=null)
                    data['min_create_revision']=min_create_revision;

                if(min_mod_revision!=null)
                    data['min_mod_revision']=min_mod_revision;

                let limit = null;

                if (skip == null || skip <=0)
                    skip = 0;


                if (count == null || count <=0){
                    limit = null
                }else{
                    limit = skip + count
                }

                if(limit!=null)
                    data['limit']=limit;

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
                o.key = Base64.decode(v.key);
                o.id = v.key;
                o.value = Base64.decode(v.value);
                rtn.push(o);
            })
        }
        return rtn;
    }

}