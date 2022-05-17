function removeSubTree(id){
    let nodes = $('#databaseDg').treegrid('getChildren', id);
    if(nodes==null)
        return ;
    $.each(nodes, function (idx, v) {
        $('#databaseDg').treegrid('remove', v.id);
    })
}

function toggleRow(row, initExpandFn){
    if(row.children!=null){
        $('#databaseDg').treegrid('toggle', row.id)
    }else{

        let datas = initExpandFn.call(row, row);

        if(datas !== false){
            $('#databaseDg').treegrid('append', {
                parent:row.id,
                data:datas
            });

            $('#databaseDg').treegrid('expand', row.id)
        }
    }
}

function newEtcdNode(nodeId){
    return {
        nodes:[
            {id: nodeId+"_1", node_id: nodeId, text:'键值', type:"kv", iconCls:"fa fa-table",state:"closed", children:[
                    {id: nodeId+"_1"+"_1", node_id: nodeId, text:'集合', type:"group", iconCls:"fa fa-object-group",
                        event:function(row){
                            console.log(row);
                            if(row.children!=null){
                                $('#databaseDg').treegrid('toggle', row.id)
                            }else{
                                let ds = [];
                                let node = $.v3browser.model.getLocalNode(row.node_id);

                                if(node.group){
                                    $.each(node.group, function (idx,v){
                                        let one = $.v3browser.model.convert.Group2Data(v);
                                        one.event = function(r){
                                            let node = $.v3browser.model.getLocalNode(r.node_id)

                                            let title = r.text.jsEncode()+'@'+node.node_name.jsEncode()+'-集合';
                                            $.v3browser.menu.addOneTabAndRefresh(title, './kv/group.html', 'fa fa-list-alt');
                                        }
                                        ds.push(one);
                                    });
                                }

                                $('#databaseDg').treegrid('append', {
                                    parent:row.id,
                                    data:ds
                                });

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
            {id: nodeId+"_4", text:'用户', node_id: nodeId, type:"user", iconCls:"fa fa-user-circle-o",state:"closed",
                event:function(row){
                    toggleRow(row, function (){
                        refreshUsers(row);
                        return false;
                    });
                }, mm:"userRootMm"},
            {id: nodeId+"_5", text:'角色', node_id: nodeId, type:"role", iconCls:"fa fa-user-o",state:"closed",
                event:function(row){
                    toggleRow(row, function (){
                        refreshRoles(row);
                        return false;
                    });
                }, mm:"roleRootMm"},
            {id: nodeId+"_6", text:'警报', node_id: nodeId, type:"alarm", iconCls:"fa fa-podcast",state1:"closed",
                // children:[
                //     {id: nodeId+"_4"+"_1", node_id: nodeId, text:'警报', type:"alarm-object", iconCls:"fa fa-bell-o",
                //         event:function(row){
                //
                //         }}
                // ]
            },
            {id: nodeId+"_7", text:'集群', node_id: nodeId, type:"cluster", iconCls:"fa fa-sitemap",state:"closed",
                event:function(row){
                    toggleRow(row, function (){
                        refreshMembers(row);
                        return false;
                    });
                }, mm:"memberRootMm"
                // children:[
                //     {id: nodeId+"_4"+"_1", node_id: nodeId, text:'集群信息', type:"cluster-info", iconCls:"fa fa-mixcloud",
                //         event:function(row){
                //
                //         }}
                // ]
            },
        ]
    }
}

function buildTreeDatas(){
    let datas = [];

    $.each(CONFIG.nodes, function (idx, val) {
        let rowData = $.v3browser.model.convert.Node2Data(val);
        rowData.node = newEtcdNode(rowData.id);
        datas.push(rowData)
    })

    return datas;
}

function openClose(){
    let row = $('#nodemm').menu('options').node;

    if(row){
        if(row.open){
            console.log("Close now")
            closeNode(row)
        }else{
            console.log("Open now")
            openNode(row);
        }
    }
}


function removeChildrenNode(row){
    if(row.node && row.node.nodes){

        $.each(row.node.nodes, function (idx,v) {
            if($('#databaseDg').iTreegrid('find',v.id)){
                $('#databaseDg').iTreegrid('remove',v.id);
            }
        })
    }
}

function closeNode(row){
    row.open = false

    removeChildrenNode(row)

    $('#databaseDg').iTreegrid('collapse',row.id)
    row.open = false;
    row.state = "closed";
    delete  row.state;
    $('#databaseDg').treegrid('refresh',row.id);
}

function openNode(row){
    removeChildrenNode(row)

    $.etcd.request.connect(row.data, function (data) {

        if(data.status ==0 ){
            row.node = newEtcdNode(row.id);

            if(row.node.nodes){
                let children = [];
                $.each(row.node.nodes, function (idx,v) {
                    children.push($.extend({}, v));
                })

                $('#databaseDg').iTreegrid('append',{
                    parent: row.id,  // the node has a 'id' value that defined through 'idField' property
                    data:children
                });

                row.state = "open"
                $('#databaseDg').treegrid('refresh',row.id);
                $('#databaseDg').iTreegrid('expand',row.id)

                row.open = true;
                $.app.show("连接etcd服务器"+row.data.node_host+":"+row.data.node_port+"成功");
                row.open = true;
            }else{
                row.open = false;
                $.app.show("错误的节点不能打开")
            }

        }else{

            row.open = false;

            if($.extends.isEmpty(data.resp_msg)){
                data.resp_msg = "服务器失去响应"
            }
            $.app.show("连接etcd服务器失败, " + data.resp_msg)
        }

    });
}

function loadTreeDg(){

    $('#databaseDg').iTreegrid({
        idField:'id',
        treeField:'text',
        singleSelect:true,
        showHeader:false,
        animate:true,
        onDblClickRow:function (row) {
            if(row == null){
                return ;
            }

            if(row.event){
                $.easyui.debug.breakpoint(row)
                if(row.event){
                    row.event(row)
                    event.preventDefault();
                }
                return ;
            }

            if (row.type == 'db') {
                if(row.open){
                    $('#databaseDg').treegrid('toggle', row.id);
                }else{
                    openNode(row);
                }
            } else {
                $('#databaseDg').treegrid('toggle', row.id);
            }
        },
        onContextMenu:function(e, row){
            console.log(row)
            e.preventDefault();

            if(row == null){
                $.v3browser.menu.createEtcdMenu(e, row);
                return ;
            }

            $.v3browser.menu.openMenu(e, row)
        },
        //data:[{"id":"2","creatorId":"admin","creator":"系统管理员","createTime":"2016-10-06 13:31:38","modifierId":"admin","modifier":"系统管理员","modifyTime":"2018-06-08 08:44:15","creatorOrgId":0,"typeValue":"公司企业","typeText":"1","id":2,"pid":1,"node_name":"192.168.56.101:32379","checked":null,"state":"closed","attributes":null,"levelId":1,"sort":1,"code":"ginghan","status":"1","isDel":0,"leaderId":"ginghan000001","iconCls":null}],
        data:buildTreeDatas(),
        columns: [[
            {
                field:'text',
                title:'服务器地址',
                width:'380px'
            }]]
    })
}

function openNodeDg(data){

    if(data==null){
        data = {node_port:32379,authorized_enabled:false,node_host:'192.168.56.101',node_name:'新建etcd连接名'}
    }

    $.iDialog.openDialog({
        title: 'Etcd-新建连接',
        minimizable:false,
        width: 800,
        height: 500,
        href: contextpath + '/createnode.html?id=',
        render:function(opts, handler){
            let d = this;
            console.log("Open dialog")

            handler.render(data)

            $("#authorized_enabled").switchbutton('options').onChange = function(checked){
                if(checked){
                    $("#node_username").textbox('enable')
                    $("#node_password").textbox('enable')
                    $("#node_username").textbox('enableValidation')
                    $("#node_password").textbox('enableValidation')
                }else{
                    $("#node_username").textbox('disable')
                    $("#node_password").textbox('disable')
                    $("#node_username").textbox('disableValidation')
                    $("#node_password").textbox('disableValidation')
                }
            }

            if (data.authorized_enabled+'' == 'true' || data.authorized_enabled+'' == '1') {
                $("#authorized_enabled").switchbutton('check')
            }else{
                $("#authorized_enabled").switchbutton('uncheck')
            }

            if($.extends.isEmpty(data.id)){
                $(this).dialog('setTitle', 'Etcd-新建连接');
            }else{
                //$(this).dialog('setTitle', 'Etcd-编辑连接\''+data.node_name.jsEncode()+'\'');
                $(this).dialog('setTitle', 'Etcd-编辑连接');
            }

        },
        leftButtonsGroup:[{
            text: '测试连接',
            iconCls: 'fa fa-save',
            btnCls: 'cubeui-btn-blue',
            handler:'ajaxForm',
            beforeAjax:function(o){
                console.log("测试连接")
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                let info = o.ajaxData
                //
                $.etcd.request.connect(info, function (data) {
                    if(data.status ==0 ){
                        $.app.alert("连接etcd服务器成功")
                    }else{
                        if($.extends.isEmpty(data.resp_msg)){
                            data.resp_msg = "服务器失去响应"
                        }
                        $.app.alert("连接etcd服务器失败, " + data.resp_msg)
                    }

                    console.log(data)
                });

                return false
            },
        }],
        buttonsGroup: [{
            text: '确定',
            iconCls: 'fa fa-save',
            btnCls: 'cubeui-btn-orange',
            handler:'ajaxForm',
            beforeAjax:function(o){
                console.log("确定")
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                console.log(o.ajaxData);
                let info = o.ajaxData;

                let rtn = $.v3browser.model.saveNode2Local(info)

                if(typeof rtn == 'string'){
                    $.app.alert(rtn)
                }else{
                    if(rtn >=0){
                        let old = $('#databaseDg').treegrid('find',info.id);
                        if(old){
                            old.data = info;
                            old.text = info.node_name;
                            closeNode(old)
                            $('#databaseDg').treegrid('refresh',info.id);
                        }
                    }else{
                        let rowData = $.v3browser.model.convert.Node2Data(info);
                        //rowData.node = newEtcdNode(rowData.id);

                        $('#databaseDg').treegrid('append', {
                            data: [rowData]
                        })

                        //$('#databaseDg').treegrid('find',info.id).children = newEtcdNode(info.id);

                    }

                    $.iDialog.closeOutterDialog($(this))
                }

                return false
            },
        }]
    });
}


function modifyUserPwd() {
    let opts = {
        id: 'pwdDialog',
        title: message.core.login.changepwd,
        width: 600,
        height: 400,
        iconCls: 'fa fa-key',
        buttons: [{
            text: message.core.label.confirm,
            iconCls: 'fa fa-save',
            btnCls: 'cubeui-btn-green',
            handler: function () {
                if($("#pwdDialog").form('validate')==true){
                    $("#pwdDialog").iDialog('close').form(
                        'reset');
                    console.log("Logout")
                }
            }
        }, {
            text: message.core.label.close,
            iconCls: 'fa fa-close',
            btnCls: 'cubeui-btn-red',
            handler: function () {
                $("#pwdDialog").iDialog('close');
            }
        }]
    };

    $.app.openDialog(opts.id, contextpath + '/modifypwd.html', 'test=1', opts);
    //$('#' + opts.id).iDialog('openDialog', opts);
};

function deleteNode(){

    let row = $('#nodemm').menu('options').node;
    
    $.app.confirm("删除连接", "确认需要删除etcd连接\'"+row.text.jsEncode()+"\'?", function () {
        $.v3browser.model.removeNode2Local(row.id);
        $('#databaseDg').treegrid('remove', row.id);
    })
}

function createEtcd() {
    openNodeDg()
}

function openEtcd() {
    let row = $('#nodemm').menu('options').node;
    openNodeDg(row.data)
}

function openEtcdAs() {
    let row = $('#nodemm').menu('options').node;
    let data = $.extend({}, row.data);
    data.node_name = data.node_name + '(2)'
    data.id="";
    openNodeDg(data);
}

function refreshNodes() {
    $.v3browser.model.loadLocalConfig()
    $('#databaseDg').treegrid('loadData',buildTreeDatas());
}

function exportEtcd(){

    let row = $('#nodemm').menu('options').node;

    $.iDialog.openDialog({
        title: 'Etcd-导出',
        minimizable:false,
        width: 900,
        height: 500,
        href: contextpath + '/export.html?id=',
        render:function(opts, handler){
            let d = this;
            console.log("Open dialog")

            handler.render({json:$.extends.json.tostring(row.data)})

        },
        buttonsGroup: [{
            text: '复制到剪贴板',
            iconCls: 'fa fa-save',
            btnCls: 'cubeui-btn-orange',
            handler:'ajaxForm',
            beforeAjax:function(o){
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                console.log(o.ajaxData);
                let info = o.ajaxData;

                $.extends.copyToClipBoard(info.json, function (){
                    $.app.alert("复制成功")
                }, function () {
                    $.app.alert("复制失败")
                })


                return false
            },
        }]
    })
}

function importEtcd(){

    $.iDialog.openDialog({
        title: 'Etcd-导入',
        minimizable:false,
        width: 900,
        height: 500,
        href: contextpath + '/import.html?id=',
        render:function(opts, handler){
            let d = this;
            console.log("Open dialog")

            handler.render({})
        },
        leftButtonsGroup:[{
            text: '校验导入内容',
            iconCls: 'fa fa-save',
            btnCls: 'cubeui-btn-blue',
            handler:'ajaxForm',
            beforeAjax:function(o){
                console.log("测试连接")
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                let info = o.ajaxData

                let newOne = null;

                try{
                    newOne = $.extends.json.toobject(info.json)
                }catch (err){
                    $.app.alert("json文件格式不正确")
                    return false
                }

                if($.extends.isEmpty(newOne.node_name)){
                    $.app.alert("json文件缺少名字")
                    return false
                }
                if($.extends.isEmpty(newOne.node_host)){
                    $.app.alert("json文件缺少主机地址")
                    return false
                }
                if($.extends.isEmpty(newOne.node_port)){
                    $.app.alert("json文件缺少端口")
                    return false
                }

                $.app.alert("数据格式校验正确")
                return false
            },
        }],
        buttonsGroup: [{
            text: '导入',
            iconCls: 'fa fa-save',
            btnCls: 'cubeui-btn-orange',
            handler:'ajaxForm',
            beforeAjax:function(o){
                console.log("确定")
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                console.log(o.ajaxData);
                let info = o.ajaxData;

                return false
            },
        }]
    })
}

function groupDg(data){
    $.iDialog.openDialog({
        title: '编辑',
        maximized1:true,
        minimizable:false,
        width: 750,
        height: 360,
        content: `      
            <div style="margin: 10px;">
            </div>
            <div class="cubeui-fluid" id="create-group-form">
                <input type="hidden" name="group_id" value="{{:id}}">
                <input type="hidden" name="db_id" value="{{:db_id}}">
                <div class="cubeui-row">
                
                    <div class="cubeui-col-sm11">
                        <label class="cubeui-form-label">名称:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textbox" id="group_name" name="group_name"
                                   value='{{:group_name}}' data-options="required:true,prompt:'集合名称，必须填写'">
                        </div>
                    </div>
                </div>
            
                <div class="cubeui-row">
                    <div class="cubeui-col-sm11">
                        <label class="cubeui-form-label">键前缀:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textbox" id="group_prefix" name="group_prefix"
                                   value='{{:group_prefix}}' data-options="required:true,prompt:'集合对应键前缀，必须填写'">
                        </div>
                    </div>
                </div>
                
                <div class="cubeui-row">
                
                    <div class="cubeui-col-sm11">
                        <label class="cubeui-form-label">备注:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textarea" id="group_demo" name="group_demo"
                                   value='{{:group_demo}}' data-options="required:false,prompt:'集合备注信息，选择填写',
                                   height:100">
                        </div>
                    </div>
                </div>
                
            </div>
            
        `,
        render:function(opts, handler){
            let d = this;
            console.log("Open dialog");

            handler.render(data)

            if($.extends.isEmpty(data.id)){
                $(this).dialog('setTitle', '新增集合')
            }else{
                //$(this).dialog('setTitle', '修改集合'+data.group_name.jsEncode())
                $(this).dialog('setTitle', '修改集合')
            }
        },
        leftButtonsGroup:[{
            text: '测试',
            iconCls: 'fa fa-save',
            btnCls: 'cubeui-btn-blue',
            handler:'ajaxForm',
            beforeAjax:function(o){
                console.log("测试")
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                let info = o.ajaxData

                $.etcd.request.kv.range(function (node, response) {
                    if($.etcd.response.check(response)){
                        $.app.info('测试成功，记录条数为' + response.count)
                    }
                }, $.v3browser.menu.getCurrentOpenMenuNode(), info.group_prefix, null, true, true, null, null);

                return false
            },
        }],
        buttonsGroup: [{
            text: '添加',
            iconCls: 'fa fa-plus-square-o',
            btnCls: 'cubeui-btn-orange',
            handler:'ajaxForm',
            beforeAjax:function(o){
                console.log("添加")
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                let info = o.ajaxData

                let msg = $.v3browser.model.saveGroup2Node(
                    $.v3browser.menu.getCurrentOpenMenuNodeId(), info);

                if(typeof msg == 'string'){
                    $.app.show("不能添加集合，"+msg);
                }else{
                    if(msg < 0){
                        $('#databaseDg').treegrid('append', {
                            parent: $.v3browser.menu.getCurrentOpenMenuRow().id,
                            data:[$.v3browser.model.convert.Group2Data(info)]
                        });
                        $('#databaseDg').treegrid('expand', $.v3browser.menu.getCurrentOpenMenuRow().id);
                    }else{
                        let old = $('#databaseDg').treegrid('find',info.id);
                        old.text = info.group_name;
                        old.data = info;

                        $('#databaseDg').treegrid('refresh', old.id);
                    }
                    $.app.show("添加集合成功");
                    $.iDialog.closeOutterDialog($(this))
                }

                return false
            }
        }]
    });
}

function removeGroup(){
    let row = $.v3browser.menu.getCurrentOpenMenuRow()
    let pid = $('#databaseDg').treegrid('getParent', row.id).id

    $.app.confirm("确定删除集合'"+row.text.jsEncode()+"'", function (){
        $.v3browser.model.removeGroupFromLocal(row.node_id, row.id)
        $('#databaseDg').treegrid('remove', row.id)
        $('#databaseDg').treegrid('refresh', pid)
    })
}

function editGroupDg(){
    let data = $.v3browser.menu.getCurrentOpenMenuRow().data;
    groupDg(data);
}

function createGroupDg(){
    let dbId = $.v3browser.menu.getCurrentOpenMenuNodeId();
    let data = {};
    data.db_id = dbId;
    groupDg(data)
}

function createUserDg(){
    let dbId = $.v3browser.menu.getCurrentOpenMenuNodeId();
    let data = {};
    data.db_id = dbId;
    groupDg(data)
}

function refreshUsers(row){
    let node;
    let dbId;

    if(row == null){
        node = $.v3browser.menu.getCurrentOpenMenuNode();
        dbId = node.id;
    }else{
        node = $.v3browser.model.getLocalNode(row.node_id);
        dbId = node.id;
    }

    let userRowId = dbId + '_4';

    $.etcd.request.auth.user_list(function (node, response) {

        if($.etcd.response.check(response)){
            $.app.show('刷新用户成功，用户个数为' + response.users.length);

            let datas = [];
            $.each(response.users, function (idx, user) {
                datas.push($.v3browser.model.convert.User2Data(user, dbId))
            })

            removeSubTree(userRowId);
            $('#databaseDg').treegrid('append', {
                parent:userRowId,
                data: datas
            });

            $('#databaseDg').treegrid('refresh', userRowId);
            $('#databaseDg').treegrid('expand', userRowId);

        }else{

        }
    }, node)
}

function refreshRoles(row){
    let node;
    let dbId=null;

    if(row == null){
        node = $.v3browser.menu.getCurrentOpenMenuNode();
        dbId = node.id;
    }else{
        node = $.v3browser.model.getLocalNode(row.node_id);
        dbId = node.id;
    }

    let roleRowId = dbId + '_5';

    $.etcd.request.auth.role_list(function (node, response) {

        if($.etcd.response.check(response)){
            $.app.show('刷新角色成功，角色个数为' + response.roles.length);

            let datas = [];
            $.each(response.roles, function (idx, role) {
                datas.push($.v3browser.model.convert.Role2Data(role, dbId))
            })

            removeSubTree(roleRowId);
            $('#databaseDg').treegrid('append', {
                parent:roleRowId,
                data: datas
            });

            $('#databaseDg').treegrid('refresh', roleRowId);
            $('#databaseDg').treegrid('expand', roleRowId);

        }else{

        }
    }, node)
}

function refreshMembers(row){
    let node=null;
    let dbId=null;

    if(row == null){
        node = $.v3browser.menu.getCurrentOpenMenuNode();
        dbId = node.id;
    }else{
        node = $.v3browser.model.getLocalNode(row.node_id);
        dbId = node.id;
    }

    let memberRowId = dbId + '_7';

    $.etcd.request.cluster.member_list(function (node, response) {

        if($.etcd.response.check(response)){
            $.app.show('刷新集群成功，集群节点个数为' + response.members.length);

            let datas = [];
            $.each(response.members, function (idx, member) {
                datas.push($.v3browser.model.convert.Member2Data(member, dbId))
            })

            removeSubTree(memberRowId);
            $('#databaseDg').treegrid('append', {
                parent:memberRowId,
                data: datas
            });

            $('#databaseDg').treegrid('refresh', memberRowId);
            $('#databaseDg').treegrid('expand', memberRowId);

        }else{

        }
    }, node)
}