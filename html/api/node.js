
//// For node
function newEtcdNode(nodeId){
    return {
        nodes:[
            {id: nodeId+"_1", node_id: nodeId, text:'键值', disableDnd: true, type:"kv", iconCls:"fa fa-table",state:"closed", children:[
                    {id: nodeId+"_1"+"_1", node_id: nodeId, text:'集合', disableDnd: true, type:"groups", iconCls:"fa fa-object-group",
                        event:function(row){
                            console.log(row);
                            toggleRow(row, function (){
                                openGroupsNodeMenu(row);
                                return false;
                            });
                        }, mm:"groupRootMm"},
                    {id: nodeId+"_1"+"_2", node_id: nodeId, text:'查询', disableDnd: true, type:"searches", iconCls:"fa fa-navicon",
                        event:function(row){
                            console.log(row);
                            toggleRow(row, function (){
                                let ds = [];
                                let node = $.v3browser.model.getLocalNode(row.node_id);
                                if(node.search){
                                    $.each(node.search, function (idx,v){
                                        let one = $.v3browser.model.convert.Search2Data(v);
                                        one.event = function(r){
                                            let node = $.v3browser.model.getLocalNode(r.node_id)

                                            //let title = r.text.jsEncode()+'@'+node.node_name.jsEncode()+'-集合';
                                            let title = $.v3browser.model.title.search(v, node)
                                            $.v3browser.menu.addOneTabAndRefresh(title, './kv/search.html', 'fa fa-navicon', node, r);
                                        }
                                        ds.push(one);
                                    });
                                }

                                $('#databaseDg').treegrid('append', {
                                    parent:row.id,
                                    data:ds
                                });

                                $('#databaseDg').treegrid('expand', row.id)
                                return false;
                            });
                        }, mm:"searchRootMm"},
                ]},
            {id: nodeId+"_2", text:'租约', node_id: nodeId, type:"lease", disableDnd: true, iconCls:"fa fa-plug",state:"closed", children:[
                    {id: nodeId+"_2"+"_1", node_id: nodeId, text:'租约', disableDnd: true, type:"lease-object", iconCls:"fa fa-ticket",
                        event:function(row){

                        }}
                ]},
            {id: nodeId+"_3", text:'对象锁', node_id: nodeId, type:"lock", disableDnd: true, iconCls:"fa fa-lock",state:"closed", children:[
                    {id: nodeId+"_3"+"_1", node_id: nodeId, text:'锁对象', disableDnd: true, type:"lock-object", iconCls:"fa fa-server",
                        event:function(row){

                        }}
                ]},
            {id: nodeId+"_4", text:'用户', node_id: nodeId, type:"user", disableDnd: true, iconCls:"fa fa-user-circle-o",state:"closed",
                event:function(row){
                    toggleRow(row, function (){
                        refreshUsers(row);
                        return false;
                    });
                }, mm:"userRootMm"},
            {id: nodeId+"_5", text:'角色', node_id: nodeId, type:"role", disableDnd: true, iconCls:"fa fa-user-o",state:"closed",
                event:function(row){
                    toggleRow(row, function (){
                        refreshRoles(row);
                        return false;
                    });
                }, mm:"roleRootMm"},
            {id: nodeId+"_6", text:'警报', node_id: nodeId, type:"alarm", disableDnd: true, iconCls:"fa fa-podcast",state1:"closed",
                event:function (){

                }},
            {id: nodeId+"_7", text:'集群', node_id: nodeId, disableDnd: true, type:"cluster", iconCls:"fa fa-sitemap",state:"closed",
                event:function(row){
                    toggleRow(row, function (){
                        refreshMembers(row);
                        return false;
                    });
                }, mm:"memberRootMm"},
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


function closeNode(row){
    row.open = false

    removeChildrenNode(row)

    $('#databaseDg').iTreegrid('collapse',row.id)
    row.open = false;
    row.state = "closed";
    delete  row.state;
    $('#databaseDg').treegrid('refresh',row.id);

    $.v3browser.menu.closeTabs(row);
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

                $('#databaseDg').treegrid('enableDndChildren', row.id);

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
        onLoadSuccess:$.easyui.event.wrap($.fn.treegrid.defaults.onLoadSuccess,function (row) {
            $(this).treegrid('enableDnd', row?row.id:null);
        }),
        onDragOver:function (targetRow, sourceRow, point) {
            console.log(""+point)
            if(sourceRow.type == 'db'){
                if(targetRow!=null && targetRow.type == 'db'){
                    if(targetRow!=null && point == 'append'){
                        return false
                    }
                    console.log(targetRow)
                    return true;
                }
                return false;
            }

            console.log(targetRow)

            if(sourceRow.type == 'group'){
                if(targetRow && (targetRow.type == 'group'||targetRow.type == 'folder')){
                    return true;
                }
                return false;
            }

            if(sourceRow.type == 'folder'){
                if(targetRow && (targetRow.type == 'group'||targetRow.type == 'folder')){
                    return true;
                }
                return false;
            }

            return false
        },
        onBeforeDrop:function (targetRow,sourceRow,point) {
            console.log(point)
            console.log(targetRow)

            if(sourceRow.type == 'db'){
                if(targetRow==null || targetRow.type == 'db'){
                    if(targetRow!=null && point == 'append'){
                        return false
                    }
                    return true;
                }
                return false;
            }

            if(sourceRow.type == 'group'||sourceRow.type == 'folder'){
                if(targetRow && targetRow.type == 'group'){
                    if(point == 'append'){
                        $.app.show('目前版本不支持集合下嵌套子集合');
                        return false
                    }
                    return true;
                }

                if(targetRow && targetRow.type == 'folder'){
                    if(sourceRow.parentRow!=null&&sourceRow.parentRow.id==targetRow.id){
                        $.app.show('操作不合法，不能自我嵌套目录');
                        return false;
                    }

                    return true;
                }

                if(sourceRow.type == 'folder' && targetRow && targetRow.type == 'folder'){

                    let parents = $.v3browser.model.util.findFolderAncestorList(targetRow);

                    let isloop = false;

                    $.each(parents, function (idx, v) {
                        if(v.id == sourceRow.id)
                            isloop = true;
                    });

                    if(isloop){
                        $.app.show('目前版本不支持集合子目录嵌套父目录');
                        return false;
                    }


                    return true;
                }

                $.app.show('不能移动到连接节点外')
                return false;
            }

            console.log(sourceRow)
        },
        onDrop:function (targetRow,sourceRow,point) {
            if(sourceRow.type == 'db'){
                if(targetRow == null){
                    if(point='append'){
                        $.v3browser.model.exchangeNode(sourceRow.id, null, 'end');
                        $.v3browser.model.saveLocalConfig();
                        return true;
                    }

                    return false;
                }
                if(targetRow.type == 'db'){
                    $.v3browser.model.exchangeNode(sourceRow.id, targetRow.id, point);
                    $.v3browser.model.saveLocalConfig();
                    return true;
                }
            }

            if(sourceRow.type == 'group' || sourceRow.type == 'folder'){
                if(point == 'append' && targetRow.type=='group'){
                    $.app.show('不支持目前版本');
                    return false;
                }
                if(targetRow.type == 'group' || targetRow.type == 'folder'){
                    let msg = exchangeGroup(sourceRow.node_id, sourceRow, targetRow, point);
                    if(typeof msg == 'string'){
                        $.app.show('目前版本不支持,' + msg);
                        return ;
                    }
                    //$.v3browser.model.exchangeGroup(sourceRow.node_id, sourceRow.id, targetRow.id, point);
                    $.v3browser.model.saveLocalConfig();
                    return true;
                }
            }

            return false;
        },
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
                        $.app.show("连接etcd服务器成功")
                    }else{
                        if($.extends.isEmpty(data.resp_msg)){
                            data.resp_msg = "服务器失去响应"
                        }
                        $.app.show("连接etcd服务器失败, " + data.resp_msg)
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
                    $.app.show(rtn)
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

function deleteNode(){

    let row = $('#nodemm').menu('options').node;

    $.app.confirm("删除连接", "确认需要删除etcd连接\'"+row.text.jsEncode()+"\'?", function () {
        $.v3browser.model.removeNode2Local(row.id);
        $.v3browser.menu.closeTabs(row);
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
                    $.app.show("复制成功")
                }, function () {
                    $.app.show("复制失败")
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
                    $.app.show("json文件格式不正确")
                    return false
                }

                if($.extends.isEmpty(newOne.node_name)){
                    $.app.show("json文件缺少名字")
                    return false
                }
                if($.extends.isEmpty(newOne.node_host)){
                    $.app.show("json文件缺少主机地址")
                    return false
                }
                if($.extends.isEmpty(newOne.node_port)){
                    $.app.show("json文件缺少端口")
                    return false
                }

                $.app.show("数据格式校验正确")
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


                let msg = $.v3browser.model.convert.Text2Node(info.json)

                if(typeof msg == 'string'){
                    $.app.show('导入失败，' + msg);
                    return ;
                }else{
                    msg.node_name = msg.node_name+'(导入)';
                    let rtn = $.v3browser.model.saveNode2Local(msg);

                    if(rtn >=0){
                        let old = $('#databaseDg').treegrid('find',msg.id);
                        if(old){
                            old.data = msg;
                            old.text = msg.node_name;
                            closeNode(old)
                            $('#databaseDg').treegrid('refresh',msg.id);
                        }
                    }else{
                        let rowData = $.v3browser.model.convert.Node2Data(msg);

                        $('#databaseDg').treegrid('append', {
                            data: [rowData]
                        })

                        //$('#databaseDg').treegrid('find',info.id).children = newEtcdNode(info.id);

                    }

                    $.app.show('导入新连接\''+msg.node_name.jsEncode()+'\'成功，');

                    $.iDialog.closeOutterDialog($(this))
                }

                return false
            },
        }]
    })
}
