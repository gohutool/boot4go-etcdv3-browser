function isTokenOK(){
    let token = $.app.localStorage.getToken();
    console.log("Token: " + token)

    if ($.extends.isEmpty(token)){
        return false;
    }else{
        return true;
    }
}

function copyArray(list){
    let rtn = [];

    $.each(list, function (idx,v){
        rtn.push($.extend({}, v))
    })

    return rtn;
}

// model
function newEtcdNode(nodeId){
    return {
        nodes:[
            {id: nodeId+"_1", node_id: nodeId, text:'键值', type:"kv", iconCls:"fa fa-table",state:"closed", children:[
                {id: nodeId+"_1"+"_1", node_id: nodeId, text:'集合', type:"group", iconCls:"fa fa-object-group",
                event:function(row){
                    console.log(row);
                    if(!$.extends.isEmpty(row.children)){
                        $('#databaseDg').treegrid('toggle', row.id)
                    }else{
                        let ds = [];
                        $.each(getLocalNode(row.node_id).group, function (idx,v){
                            ds.push(Group2Data(v))
                        })
                        $('#databaseDg').treegrid('append', {
                            parent:row.id,
                            data:ds
                        })
                        $('#databaseDg').treegrid('expand', row.id)
                    }
                }, mm:"groupRootMm"},
                {id: nodeId+"_1"+"_2", node_id: nodeId, text:'查询', type:"group-search", iconCls:"fa fa-navicon",
                event:function(row){

                }},
            ]},
            {id: nodeId+"_2", text:'租约', node_id: nodeId, type:"lease", iconCls:"fa fa-plug",state:"closed", children:[
                {id: nodeId+"_2"+"_1", node_id: nodeId, text:'租约', type:"lease-object", iconCls:"fa fa-ticket",
                event:function(row){

                }}
            ]},
            {id: nodeId+"_3", text:'对象锁', node_id: nodeId, type:"lock", iconCls:"fa fa-lock",state:"closed", children:[
                {id: nodeId+"_3"+"_1", node_id: nodeId, text:'锁对象', type:"lock-object", iconCls:"fa fa-server",
                event:function(row){

                }}
            ]},
            {id: nodeId+"_4", text:'用户', node_id: nodeId, type:"user", iconCls:"fa fa-user-circle-o",state:"closed", children:[
                {id: nodeId+"_4"+"_1", node_id: nodeId, text:'用户', type:"user-object", iconCls:"fa fa-user-circle",
                event:function(row){

                }}
            ]},
            {id: nodeId+"_5", text:'角色', node_id: nodeId, type:"role", iconCls:"fa fa-user-o",state:"closed", children:[
                {id: nodeId+"_4"+"_1", node_id: nodeId, text:'角色', type:"role-object", iconCls:"fa fa-users",
                event:function(row){

                }}
            ]},
            {id: nodeId+"_6", text:'警报器', node_id: nodeId, type:"alarm", iconCls:"fa fa-podcast",state:"closed", children:[
                {id: nodeId+"_4"+"_1", node_id: nodeId, text:'警报器', type:"alarm-object", iconCls:"fa fa-bell-o",
                event:function(row){

                }}
            ]},
            {id: nodeId+"_7", text:'集群', node_id: nodeId, type:"cluster", iconCls:"fa fa-server",state:"closed", children:[
                {id: nodeId+"_4"+"_1", node_id: nodeId, text:'集群信息', type:"cluster-info", iconCls:"fa fa-mixcloud",
                event:function(row){

                }}
            ]},
        ]
    }
}

// function
$.app.beforeRequest = function (options){
    console.log("$.app.beforeRequest")

    if(options.headers && options.headers.isetcd){
        let data = options.data;

        // if(data && typeof data == 'object'){
        //     data = $.extends.base64JsonEncode(data)
        //     options.data = data
        // }

        options.isetcd = options.headers.isetcd
        delete options.headers.isetcd
        delete options.headers.uid
        delete options.headers.Authorization

        if(!$.extends.isEmpty(options.headers.token)){
            options.headers.Authorization = options.headers.token
            delete options.headers.token
        }
    }

    console.log(options)
}

$.app.afterSuccess = function (options, response){

    if (options.headers.isetcd || response.xhr.getResponseHeader("Grpc-Metadata-Content-Type") == "application/grpc"){
        let data = response.data

        if(data && typeof data == 'object'){
            data.status = 0
            //data = $.extends.base64JsonDecode(data)
            response.data = data
        }else{
            //response.data = Base64.decode(data)
        }
    }

    console.log("$.app.afterSuccess")
    console.log(response)
}

$.app.afterError = function (options, response){
    console.log("$.app.afterError")

    // if(response.xhr.getResponseHeader("Grpc-Metadata-Content-Type") == "application/grpc" ||
    //     (options.headers && options.headers.isetcd) ){
    //
    //     let data = response.data
    //
    //     if(data && typeof data == 'object'){
    //         data = $.extends.base64JsonDecode(data)
    //         response.data = data
    //     }else{
    //         response.data = Base64.decode(data)
    //     }
    // }

    console.log(response)
}

$.etcd = {}

$.etcd.getJson = function(url, datastr, fn, ignoreerror, progressing, requestHeader){
    if(requestHeader == null){
        requestHeader = {}
    }
    requestHeader.isetcd = true

    if(typeof datastr == 'object'){
        datastr = $.extends.json.tostring(datastr)
    }

    $.app.ajax(url, datastr, 'GET', "json", fn, ignoreerror, progressing, requestHeader);
};

$.etcd.deleteJson = function(url, datastr, fn, ignoreerror, progressing, requestHeader){
    if(requestHeader == null){
        requestHeader = {}
    }
    requestHeader.isetcd = true

    if(typeof datastr == 'object'){
        datastr = $.extends.json.tostring(datastr)
    }

    $.app.ajax(url, datastr, 'DELETE', "json", fn, ignoreerror, progressing, requestHeader);
};

$.etcd.putJson = function(url, datastr, fn, ignoreerror, progressing, requestHeader){
    if(requestHeader == null){
        requestHeader = {}
    }
    requestHeader.isetcd = true

    if(typeof datastr == 'object'){
        datastr = $.extends.json.tostring(datastr)
    }

    $.app.ajax(url, datastr, 'PUT', "json", fn, ignoreerror, progressing, requestHeader);
};

$.etcd.postJson = function(url, datastr, fn, ignoreerror, progressing, requestHeader){
    if(requestHeader == null){
        requestHeader = {}
    }
    requestHeader.isetcd = true

    if(typeof datastr == 'object'){
        datastr = $.extends.json.tostring(datastr)
    }

    $.app.ajax(url, datastr, 'POST', "json", fn, ignoreerror, progressing, requestHeader);
};

// let oldPrepareData4Result =  prepareData4Result
//
// function prepareData4Result(data, defaultStatus){
//     oldPrepareData4Result(data, defaultStatus)
// }


let NODES_KEY = "etcd-v3-browser-config"
let CONFIG = {}

function saveAuthorization(id, token){
    let idx = findLocalNode(id);
    if(idx<0){
        return '节点不存在';
    }

    let node = CONFIG.nodes[idx];

    if(node.authorized_enabled!='1'){
        return '节点不需要认证';
    }

    node.node_token = token;
    saveNode2Local(node);
}

/**
 *
 * @param etcdID
 * @param group   group_name, group_prefix, group_demo
 */
function addGroup2Node(etcdID, group) {
    let node = getLocalNode(etcdID);

    if(node==null){
        return '节点不存在';
    }

    group.id = Math.uuid();
    group.group_id = group.id;
    group.node_id = etcdID;
    let date = new Date()
    group.createtime = date.Format('yyyy-MM-dd HH:mm:ss');

    let groups = node.group;

    if(groups==null){
        groups = [];
    }

    groups.push($.extend({}, group));
    node.group = groups;

    saveLocalConfig()
}

function removeGroupFromLocal(etcdID, groupId){
    let node = getLocalNode(etcdID);

    if(node.group){
        let idx = -1;
        $.each(node.group, function (i,v){
            if(groupId == v.id)
                idx = i;
        })

        if(idx >=0){
            node.group.splice(idx, 1);
        }

        saveLocalConfig()
    }
}

function saveNode2Local(node){
    if(node == null)
        return '空对象不能保存';

    if($.extends.isEmpty(node.id)){
        node.id = Math.uuid()
    }

    if(CONFIG.nodes == null){
        CONFIG.nodes = [];
    }

    let idx = findLocalNode(node.id);

    if(idx >= 0){
        let date = new Date()
        node.createtime = date.Format('yyyy-MM-dd HH:mm:ss');
        CONFIG.nodes[idx] = node;
        saveLocalConfig()
        return idx;
    }else{
        let date = new Date()
        node.createtime = date.Format('yyyy-MM-dd HH:mm:ss');
        CONFIG.nodes.push(node);
        saveLocalConfig()

        return -1;
    }

}

function checkCommandResponse(response){
    if(response&&response.code==16){
        $.app.show('连接已经失效或者错误，请关闭连接重新进行连接');
        return false;
    }else if(response&&response.code){
        $.app.show('服务器错误信息:'+response.error);
        return false;
    }

    return true
}

function addNode2Local(node){
    if(node == null)
        return '空对象不能保存';

    if($.extends.isEmpty(node.id)){
        node.id = Math.uuid()
    }

    if(CONFIG.nodes == null){
        CONFIG.nodes = [];
    }

    let idx = findLocalNode(node.id);

    if(idx >= 0){
        return '节点已经存在';
    }else{
        let date = new Date()
        node.createtime = date.Format('yyyy-MM-dd HH:mm:ss');
        CONFIG.nodes.push(node);
        saveLocalConfig()

        return null;
    }
}

function removeNode2Local(id){
    let idx = findLocalNode(id);

    if(idx<0){
        return '节点不存在';
    }

    CONFIG.nodes.splice(idx, 1)
    saveLocalConfig()
}

function getLocalNode(id){
    let idx = findLocalNode(id);
    if(idx<0){
        return null
    }

    return CONFIG.nodes[idx]
}

function findLocalNode(id){
    let idx = -1;
    $.each(CONFIG.nodes, function (i, value){
        if(id == value.id){
            idx = i;
            return false;
        }
    })

    return idx;
}

function loadLocalConfig(){
    CONFIG = $.extends.json.toobject($.app.localStorage.getItem(NODES_KEY, "{}"))

    if(CONFIG.nodes == null){
        CONFIG.nodes = {}
    }
}

function saveLocalConfig(){
    let date = new Date()
    CONFIG.updatetime =date.Format('yyyy-MM-dd HH:mm:ss');

    $.app.localStorage.saveItem(NODES_KEY, $.extends.json.tostring(CONFIG))
}

loadLocalConfig()

function Node2Data(node){
    let row = {};
    let rowData = $.extend({}, node);
    row.id = node.id;
    row.data = rowData;
    row.text = node.node_name;
    // row.state = 'closed';
    row.iconCls = 'fa fa-database';
    row.type='db';

    row.node = newEtcdNode(node.id);

    return row;
}

function Group2Data(group){
    let row = {};
    let rowData = $.extend({}, group);
    row.id = group.id;
    row.node_id = group.node_id;
    row.data = rowData;
    row.text = group.group_name;
    // row.state = 'closed';
    row.iconCls = 'fa fa-list-alt';
    row.type='group';
    row.mm = "groupMm";

    return row;
}

function buildTreeDatas(){
    let datas = [];

    $.each(CONFIG.nodes, function (idx, val) {
        datas.push(Node2Data(val))
    })

    return datas;
}

function connectEtcdServer(serverInfo, fn){
    let data = null;
    let url = null;

    if(serverInfo.authorized_enabled){
        console.log("authorized_enabled is enabled")
        url = AUTH_URL.format2(serverInfo)
        data = {};
        data.name = serverInfo.node_username;
        data.password = serverInfo.node_password;
    }else{
        console.log("authorized_enabled is disabled")
        url = ECHO_URL.format2(serverInfo)
        data = {};
        data.count_only = true;
        data.key = Base64.encode('/test/');
    }

    console.log(serverInfo)

    $.etcd.postJson(url, data, function (response) {
        fn(response)
        console.log(response)
    }, true)
}

function getClusterId(header){
    if(header==null){
        return '';
    }

    return $.extends.isEmpty(header['cluster_id'], '');
}

function getMemberId(header){
    if(header==null){
        return '';
    }

    return $.extends.isEmpty(header['member_id'], '');
}

function getLastRevision(header){
    if(header==null){
        return '';
    }

    return $.extends.isEmpty(header['revision'], '');
}

function getRaftTerm(header){
    if(header==null){
        return '';
    }

    return $.extends.isEmpty(header['raft_term'], '');
}

function buildTokenHeader(etcdId) {
    let idx = findLocalNode(etcdId);
    if(idx<0)
        return {};

    let node = CONFIG.nodes[idx];

    if(node.authorized_enabled!='1'){
        return {};
    }

    return {"token":node.node_token};
}

function execCmd(etcdID, cmd){
    if($.extends.isEmpty(etcdID)){
        cmd({});
    }else{
        let idx = findLocalNode(etcdID);

        if(idx<0){
            $.app.show('连接{id}不存在'.format2({id:etcdID}));
            return;
        }

        let node = CONFIG.nodes[idx];

        if(node.authorized_enabled!='1'){
            cmd(node);
        }else{
            if($.extends.isEmpty(node.node_token)){
                connectEtcdServer(node, function (data) {
                    if(data.status ==0 ){
                        saveAuthorization(etcdID, data.token);
                        cmd(node);
                    }else{
                        $.app.show("连接etcd服务器失败, " + data.resp_msg)
                    }
                });
            }else{
                cmd(node);
            }
        }
    }
}

function getCurrentOpenMenuRow() {
    return CURRENT_OPEN_MENU_ROW;
}

function getCurrentOpenMenuNodeId() {
    let row = CURRENT_OPEN_MENU_ROW;
    let dbId = row.id.substring(0, row.id.indexOf("_"));
    return dbId;
}

function getCurrentOpenMenuNode() {
    let row = CURRENT_OPEN_MENU_ROW;
    let dbId = row.id.substring(0, row.id.indexOf("_"));

    let idx = findLocalNode(dbId)
    if(idx<0)
        return null;

    return CONFIG.nodes[idx];
}

function prefixFormat(prefix){
    if($.extends.isEmpty(prefix))
        return prefix;

    if(prefix.length==1){
        return String.fromCharCode(prefix.charCodeAt(0)+1)
    }else{
        return prefix.substring(0, prefix.length-1) + String.fromCharCode(prefix.charCodeAt(prefix.length-1)+1)
    }
}

// API
let API_ROOT = 'http://{node_host}:{node_port}'

let MTN_URL = API_ROOT + '/v3/maintenance/status'
let ECHO_URL = API_ROOT + '/v3/kv/range'
let RANGE_URL = API_ROOT + '/v3/kv/range'
let AUTH_URL = API_ROOT + '/v3/auth/authenticate'
let VERSION_URL = API_ROOT + '/version'


function kvRange(fn, etcdID, key, range, withPrefix, count_only, sort_order, sort_target){
    execCmd(etcdID, function (node) {
        let data = {};

        data['key']=Base64.encode(key);
        if(withPrefix){
            data['range_end']=Base64.encode(prefixFormat(key));
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

        $.etcd.postJson(RANGE_URL.format2(node), data, function (response) {
            fn(node, response)
            // $.app.show(response)
        }, true, null, buildTokenHeader(etcdID))
    })
}