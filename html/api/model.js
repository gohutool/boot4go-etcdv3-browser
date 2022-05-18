let NODES_KEY = "etcd-v3-browser-config"
let CONFIG = {}

$.etcd.callback.authorizeRefreshed = function (token, response) {
    console.log(this)
    if(!$.extends.isEmpty(this.id)){
        console.log("Token: " + token);
        this.node_token = token;
        $.v3browser.model.saveAuthorization(this.id, token);
    }
}

$.v3browser = $.extend({}, $.v3browser);

$.v3browser.model = {
    loadLocalConfig: function(){
        CONFIG = $.extends.json.toobject($.app.localStorage.getItem(NODES_KEY, "{}"))

        if(CONFIG.nodes == null){
            CONFIG.nodes = {}
        }
    },
    saveLocalConfig : function (){
        let date = new Date()
        CONFIG.updatetime =date.Format('yyyy-MM-dd HH:mm:ss');

        $.app.localStorage.saveItem(NODES_KEY, $.extends.json.tostring(CONFIG))
    },
    getLocalNode: function(id){
        let idx = $.v3browser.model.findLocalNode(id);
        if(idx<0){
            return null
        }

        return CONFIG.nodes[idx]
    },
    findLocalNode: function(id){
        let idx = -1;
        $.each(CONFIG.nodes, function (i, value){
            if(id == value.id){
                idx = i;
                return false;
            }
        })

        return idx;
    },
    addNode2Local: function(node){
        if(node == null)
            return '空对象不能添加';

        if($.extends.isEmpty(node.id)){
            node.id = Math.uuid()
        }

        if(CONFIG.nodes == null){
            CONFIG.nodes = [];
        }

        let idx = $.v3browser.model.findLocalNode(node.id);

        if(idx >= 0){
            return '节点已经存在';
        }else{
            let date = new Date()
            node.createtime = date.Format('yyyy-MM-dd HH:mm:ss');
            CONFIG.nodes.push(node);
            $.v3browser.model.saveLocalConfig()

            return null;
        }
    },
    removeNode2Local: function(id){
        let idx = $.v3browser.model.findLocalNode(id);

        if(idx<0){
            return '节点不存在';
        }
        CONFIG.nodes.splice(idx, 1)
        $.v3browser.model.saveLocalConfig()
    },
    saveNode2Local: function(node){
        if(node == null)
            return '空对象不能保存';

        if($.extends.isEmpty(node.id)){
            node.id = Math.uuid()
        }

        if(CONFIG.nodes == null){
            CONFIG.nodes = [];
        }

        let idx = $.v3browser.model.findLocalNode(node.id);

        if(idx >= 0){
            let date = new Date()
            let nodeData = CONFIG.nodes[idx];
            nodeData.node_name = node.node_name;
            nodeData.node_demo = node.node_demo;
            nodeData.node_port = node.node_port;
            nodeData.node_host = node.node_host;
            nodeData.authorized_enabled = node.authorized_enabled;
            nodeData.node_username = node.node_username;
            nodeData.node_password = node.node_password;
            nodeData.node_token = node.node_token;

            $.extend(node, nodeData)

            node.updatetime = date.Format('yyyy-MM-dd HH:mm:ss');

            $.v3browser.model.saveLocalConfig()
            return idx;
        }else{
            let date = new Date()
            node.createtime = date.Format('yyyy-MM-dd HH:mm:ss');
            CONFIG.nodes.push(node);
            $.v3browser.model.saveLocalConfig()

            return -1;
        }
    },
    removeGroupFromLocal: function(etcdID, groupId){
        let node = $.v3browser.model.getLocalNode(etcdID);

        if(node.group){
            let idx = -1;
            $.each(node.group, function (i,v){
                if(groupId == v.id)
                    idx = i;
            })

            if(idx >=0){
                node.group.splice(idx, 1);
            }

            $.v3browser.model.saveLocalConfig()
        }
    },
    /**
     *
     * @param etcdID
     * @param group   group_name, group_prefix, group_demo
     */
    saveGroup2Node: function (etcdID, group) {
        let node = $.v3browser.model.getLocalNode(etcdID);

        let groups = node.group;

        if(groups==null){
            groups = [];
        }

        if(node==null){
            return '节点不存在';
        }

        let idx = findIdx(node.group, group.group_id);

        if($.extends.isEmpty(group.group_id)||idx<0){
            group.id = Math.uuid();
            group.group_id = group.id;
            group.node_id = etcdID;
            let date = new Date()
            group.createtime = date.Format('yyyy-MM-dd HH:mm:ss');

            groups.push($.extend({}, group));
            node.group = groups;
            $.v3browser.model.saveLocalConfig();

            return -1;
        }else{
            let one = groups[idx];

            //one.id = group.id;
            one.group_id = node.id;
            one.group_prefix = group.group_prefix;
            one.group_demo = group.group_demo;
            one.group_name = group.group_name;

            let date = new Date()
            node.updatetime = date.Format('yyyy-MM-dd HH:mm:ss');
            groups[idx] = one;

            node.group = groups;
            $.v3browser.model.saveLocalConfig();

            $.extend(group, one);

            return idx;
        }
    },
    saveAuthorization: function(id, token){
        let idx = $.v3browser.model.findLocalNode(id);
        if(idx<0){
            return '节点不存在';
        }

        let node = CONFIG.nodes[idx];

        if(node.authorized_enabled!='1'){
            return '节点不需要认证';
        }

        node.node_token = token;
        $.v3browser.model.saveNode2Local(node);
    },
    convert: {
        Node2Data: function(node){
            let row = {};
            let rowData = $.extend({}, node);
            row.id = node.id;
            row.data = rowData;
            row.text = node.node_name;
            // row.state = 'closed';
            row.iconCls = 'fa fa-database';
            row.type='db';

            return row;
        },
        // group group_name/group_prefix/group_demo/id/node_id/group_id
        Group2Data: function(group){
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
            row.prefix = group.group_prefix;

            return row;
        },
        User2Data:function(username, node_id){
            let row = {};
            row.text = username;
            row.node_id = node_id;
            row.type='user-object';
            row.id = node_id + '_' + Math.uuid();
            //row.id = node_id + '_' + username;
            row.iconCls = 'fa fa-user-circle';
            row.mm = 'userMm';
            return row;
        },
        Role2Data:function(rolename, node_id){
            let row = {};
            row.text = rolename;
            row.node_id = node_id;
            row.type='role-object';
            row.id = node_id + '_' + Math.uuid();
            //row.id = node_id + '_' + username;
            row.iconCls = 'fa fa-user';
            row.mm = 'roleMm';
            return row;
        },
        Member2Data:function(member, node_id){
            let row = {};
            row.text = member.peerURLs[0];
            row.node_id = node_id;
            row.type='cluster-info';
            row.id = node_id + '_' + member.ID;
            //row.id = node_id + '_' + username;
            row.iconCls = 'fa fa-server';
            row.mm = 'memberMm';
            return row;
        }
    },
    title:{
        group:function(group, node){
            let title = group.group_name.jsEncode()+'@'+node.node_name.jsEncode()+'-集合';
            return title;
        }
    }

}

$.v3browser.model.loadLocalConfig()







