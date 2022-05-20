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
    getDataType :function (model){
        if(model.hasOwnProperty('group_id'))
            return 'group';
        if(model.hasOwnProperty('folder_id'))
            return 'folder';

        return 'unknown';
    },
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
    removeGroupFromLocal: function(etcdID, groupId, parentRow){
        let node = $.v3browser.model.getLocalNode(etcdID);

        if(node.group==null){
            node.group = [];
        }

        let groups = null;

        if(parentRow==null){
            groups = node.group
        }else{
            let parents = $.v3browser.model.util.findFolderAncestorList(parentRow);
            if(parents==null || parents.length == 0){
                groups = node.group;
            }else{
                let g = parents[parents.length-1].data.group;
                if(g == null){
                    g = [];
                    parents[parents.length-1].data.group  = g;
                }
                groups = g;
                parents[parents.length-1].data.group = groups;
            }
        }

        if(groups){
            let idx = -1;
            $.each(groups, function (i,v){
                if(groupId == v.id)
                    idx = i;
            })

            if(idx >=0){
                groups.splice(idx, 1);
            }

            $.v3browser.model.saveLocalConfig()
        }
    },
    removeFolderFromLocal: function(etcdID, folderId){
        let node = $.v3browser.model.getLocalNode(etcdID);

        if(node.group){
            let idx = -1;
            $.each(node.group, function (i,v){
                if(folderId == v.id)
                    idx = i;
            })

            if(idx >=0){
                node.group.splice(idx, 1);
            }

            $.v3browser.model.saveLocalConfig()
        }
    },
    exchangeNode:function(id1, id2, point){
        if(point == 'end'){
            exchangeAfter(id1, CONFIG.nodes, null)
        }else if(point == 'top'){
            exchangeBefore(id1, CONFIG.nodes, id2)
        }else{
            exchangeAfter(id1, CONFIG.nodes, id2)
        }
    },
    exchangeGroup:function(nodeId, id1, id2, point){
        let node = $.v3browser.model.getLocalNode(nodeId);
        let group = node.group || [];
        node.group = group;

        if(point == 'top'){
            exchangeBefore(id1, node.group, id2)
        }else{
            exchangeAfter(id1, node.group, id2)
        }
    },
    /**
     *
     * @param etcdID
     * @param group   group_name, group_prefix, group_demo
     */
    saveGroup2Node: function (etcdID, group, parentRow) {

        let node = $.v3browser.model.getLocalNode(etcdID);

        if(node==null){
            return '节点不存在';
        }

        if(parentRow == null || parentRow.type == 'groups'){
            let groups = node.group;

            if(groups==null){
                groups = [];
            }

            let rtn = this._saveGroup2List(node, group, groups);
            node.group = groups;

            let date = new Date()
            node.updatetime = date.Format('yyyy-MM-dd HH:mm:ss');
            $.v3browser.model.saveLocalConfig();

            return rtn;
        }

        if(parentRow.type!='folder'){
            $.app.show('不能在当前添加集合, 只有在目录或者集合根路径下才能添加集合')
            return false;
        }

        let parents = $.v3browser.model.util.findFolderAncestorList(parentRow);

        let parent = parents[parents.length-1].data;

        let groups = parent.group;

        if(groups==null){
            groups = [];
        }

        let rtn = this._saveGroup2List(node, group, groups);

        parent.group = groups;

        let date = new Date()
        node.updatetime = date.Format('yyyy-MM-dd HH:mm:ss');
        $.v3browser.model.saveLocalConfig();

        return rtn;
    },
    _saveGroup2List:function(node, group, groups){

        let idx = findIdx(groups, group.group_id);

        if($.extends.isEmpty(group.group_id)||idx<0){
            group.id = Math.uuid();
            group.group_id = group.id;
            group.node_id = node.id;

            let date = new Date()
            group.createtime = date.Format('yyyy-MM-dd HH:mm:ss');

            groups.push($.extend({}, group));

            return -1;
        }else{
            let one = groups[idx];

            //one.id = group.id;
            one.group_id = group.group_id;
            one.group_prefix = group.group_prefix;
            one.group_demo = group.group_demo;
            one.group_name = group.group_name;

            groups[idx] = one;

            $.extend(group, one);

            return idx;
        }
    },
    _saveFolder2List:function(node, folder, groups){

        let idx = findIdx(groups, folder.folder_id);

        if($.extends.isEmpty(folder.folder_id)||idx<0){
            folder.id = Math.uuid();
            folder.folder_id = folder.id;
            folder.node_id = node.id;
            folder.db_id = node.id;
            let date = new Date()
            folder.createtime = date.Format('yyyy-MM-dd HH:mm:ss');

            folder.group = [];
            groups.push($.extend({}, folder));

            return -1;
        }else{
            let one = groups[idx];

            //one.id = group.id;
            one.folder_id = folder.folder_id;
            one.folder_demo = folder.folder_demo;
            one.folder_name = folder.folder_name;

            if(one.group == null)
                one.group = [];

            groups[idx] = one;

            $.extend(folder, one);
            delete folder['groups']

            return idx;
        }
    },
    saveFolder2Node: function (etcdID, folder, parentRow) {
        let node = $.v3browser.model.getLocalNode(etcdID);

        if(node==null){
            return '节点不存在';
        }

        let groups = node.group;

        if(groups==null){
            groups = [];
            node.group = groups;
        }

        if(parentRow==null || parentRow.type == 'groups'){
            let rtn = this._saveFolder2List(node, folder, groups);
            node.group = groups;

            let date = new Date()
            node.updatetime = date.Format('yyyy-MM-dd HH:mm:ss');
            $.v3browser.model.saveLocalConfig();

            return rtn;
        }

        if(parentRow.type!='folder'){
            $.app.show('不能在当前添加目录, 只有在目录或者集合根路径下才能添加目录')
            return false;
        }

        let parents = $.v3browser.model.util.findFolderAncestorList(parentRow);

        let parent = parents[parents.length-1].data;

        groups = parent.group;

        if(groups==null){
            groups = [];
        }

        let rtn = this._saveFolder2List(node, folder, groups);

        parent.group = groups;

        let date = new Date()
        node.updatetime = date.Format('yyyy-MM-dd HH:mm:ss');
        $.v3browser.model.saveLocalConfig();

        return rtn;

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
        Text2Node: function (json) {

            let newOne = null;

            try{
                newOne = $.extends.json.toobject2(json);
                console.log(newOne)
            }catch (err){
                return "json文件格式不正确"
            }

            if($.extends.isEmpty(newOne.node_name)){
                return "json文件缺少名字"
            }
            if($.extends.isEmpty(newOne.node_host)){
                return "json文件缺少主机地址"
            }
            if($.extends.isEmpty(newOne.node_port)){
                return "json文件缺少端口"
            }


            let date = new Date()
            date = date.Format('yyyy-MM-dd HH:mm:ss');

            let newId = Math.uuid();

            newOne.id = newId;
            newOne.createtime = date;
            delete newOne['updatetime'];

            if(newOne.group){
                $.each(newOne.group, function (idx, g){
                    let gId = Math.uuid();
                    g.id = gId;
                    g.group_id = gId;
                    g.node_id=newId;
                    g.db_id = newId;
                    g.createtime = date;
                    delete g['updatetime'];
                })
            }

            return newOne
        },
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
        // group group_name/group_prefix/group_demo/id/node_id/group_id
        Folder2Data: function(folder){
            if(folder.group==null)
                folder.group = [];

            let row = {};
            let rowData = $.extend({}, folder);
            row.id = folder.id;
            row.node_id = folder.node_id;
            row.data = rowData;
            delete row.data.group;
            row.text = folder.folder_name;
            row.state = 'open';
            row.iconCls = 'fa fa-folder-o';
            row.type='folder';
            row.mm = "folderMm";
            return row;
        },
        // group group_name/group_prefix/group_demo/id/node_id/group_id
        Search2Data: function(search){
            let row = {};
            let rowData = $.extend({}, search);
            row.id = search.id;
            row.search_id = search.id;
            row.node_id = search.node_id;
            row.data = rowData;
            row.text = search.search_name;
            // row.state = 'closed';
            row.iconCls = 'fa fa-search';
            row.type='search';
            row.mm = "searchMm";
            row.param = search.param;

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
        },
        EmptySearch:function(node_id){
            return {
                param:{},
                node_id:node_id,
                id:'',
            }
        },
        exchange:function(row1, row2, rows){

        }
    },
    title:{
        group:function(group, node){
            let groupName = (typeof group == 'string')?group:group.group_name;
            let nodeName = (typeof node == 'string')?node:node.node_name;

            let title = groupName.jsEncode()+'@'+nodeName.jsEncode()+'-集合';
            return title;
        },
        search:function(search, node){
            let searchName = (typeof search == 'string')?search:search.search_name;
            let nodeName = (typeof node == 'string')?node:node.node_name;
            let title = searchName.jsEncode()+'@'+nodeName.jsEncode()+'-查询';
            return title;
        },
        newSearch:function(node){
            let title = '新建@'+node.node_name.jsEncode()+'-查询';
            return title;
        }
    },
    util:{
        findFolderAncestorList: function(row){
            let node = $.v3browser.model.getLocalNode(row.node_id);

            if(node.group==null){
                node.group = [];
                return [];
            }

            let rtn = [];

            if(row.type=='folder')
                rtn.push(row);

            while(row.parentRow && row.parentRow.type=='folder'){
                rtn.push(row.parentRow);
                row = row.parentRow;
            }

            rtn = rtn.reverse()

            let idxRtn = []

            let list = node.group;

            $.each(rtn, function (i, val) {
                let idx = findIdx(list, val.id);
                if(idx>=0){
                    if(val.type=='folder'){
                        if(list[idx].group==null){
                            list[idx].group = [];
                        }

                        idxRtn.push({index:idx, row: val, data: list[idx]})

                        list = list[idx].group;
                    }else{
                        return false;
                    }
                }
                else
                    return false;
            });

            return idxRtn;
        },
    }
}


$.v3browser.model.loadLocalConfig()







