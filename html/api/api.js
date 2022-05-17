let V3_ENDPOINT = 'http://{node_host}:{node_port}'

let V3_MTN = '/v3/maintenance/status'
let V3_ECHO = '/v3/kv/range'
let V3_RANGE = '/v3/kv/range'
let V3_AUTH = '/v3/auth/authenticate'
let V3_VERSION = '/version'

let V3_AUTH_USER_LIST = '/v3/auth/user/list'
let V3_AUTH_ROLE_LIST = '/v3/auth/role/list'

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

$.etcd.postJson = function(url, datastr, fn, requestHeader){

    if(requestHeader == null){
        requestHeader = {};
    }

    requestHeader.isetcd = true

    if(typeof datastr == 'object'){
        datastr = $.extends.json.tostring(datastr)
    }

    $.app.ajax(url, datastr, 'POST', "json", fn, true, null, requestHeader);
};

$.etcd.callback = {
    authorizeRefreshed : function (token,response){
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
    connect: function(serverInfo, fn){
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

            fn.call(serverInfo, response)
            console.log(response)
        })
    },
    kv:{
        range: function (fn, serverInfo, key, range, withPrefix, count_only, sort_order, sort_target){
            $.etcd.request.execute(serverInfo, function (node) {
                let data = {};

                data['key']=Base64.encode(key);
                if(withPrefix){
                    data['range_end']=Base64.encode($.etcd.request.prefixFormat(key));
                }else{
                    data['range_end']=range;
                }

                if(sort_order!=null){
                    data['sort_order']=Base64.encode(sort);
                }else{
                    data['sort_order']='NONE';
                }

                if(sort_target!=null)
                    data['sort_target']='NONE';

                if(count_only)
                    data['count_only']=true;

                $.etcd.postJson(V3_ENDPOINT.format2(node) + V3_RANGE, data, function (response) {
                    fn(node, response)
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
    }
};

$.etcd.response = {
    check: function (response){
        if(response&&response.code==16){
            $.app.show('连接已经失效或者错误，请关闭连接重新进行连接');
            return false;
        }else if(response&&response.code){
            $.app.show('服务器错误信息:'+response.error);
            return false;
        }

        return true
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

}