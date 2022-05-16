
let CURRENT_OPEN_MENU_ROW = null

function openMenu(e, row){
    CURRENT_OPEN_MENU_ROW = row;

    switch (row.type){
        case "kv":
            break
        case "lease":
            break
        case "lock":
            break
        case "user":
            break
        case "role":
            break
        case "alarm":
            break
        case "cluster":
            break
        case "db":
            if(row.open){
                openOpenMenu(e, row)
            }else{
                openCloseMenu(e, row)
            }
            break
        default:
            if(row.mm){
                let dbRow = $('#nodemm').menu('options').node;

                if($.isFunction(row.mm)){
                    let mm = row.mm.call(row, dbRow, $('#databaseDg'));
                    if(mm){
                        $(mm).menu('show', {
                            left: e.pageX,
                            top: e.pageY
                        });
                    }
                }else{
                    $('#'+row.mm).menu('show', {
                        left: e.pageX,
                        top: e.pageY
                    });
                }
            }
            break
    }
}

function openClose(){
    let row = $('#nodemm').menu('options').node;

    if(row){
        if(row.open){
            console.log("Close now")
            row.open = false
            closeNode(row)
        }else{
            console.log("Open now")
            row.open = true;
            openNode(row);
        }
    }
}

function openOpenMenu(e, row){

    $('#nodemm').menu('options').node = row;
    let m = $('#nodemm').menu('getItem',  $('#menuitem01')[0]);

    $('#nodemm').iMenu('setText', {
        target: m.target,
        text: "关闭连接"
    });
    $('#nodemm').iMenu('setIcon', {
        target: $('#menuitem01')[0],
        iconCls: "fa fa-undo"
    });

    $('#nodemm').menu('show', {
        left: e.pageX,
        top: e.pageY
    });
}

function openCloseMenu(e, row){
    $('#nodemm').menu('options').node = row;
    let m = $('#nodemm').menu('getItem',  $('#menuitem01')[0]);

    $('#nodemm').iMenu('setText', {
        target: m.target,
        text: "打开连接"
    });

    $('#nodemm').iMenu('setIcon', {
        target: m.target,
        iconCls: "fa fa-folder-open-o"
    });

    $('#nodemm').menu('show', {
        left: e.pageX,
        top: e.pageY
    });
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
    removeChildrenNode(row)

    $('#databaseDg').iTreegrid('collapse',row.id)
    row.state = "closed";
    delete  row.state;
    $('#databaseDg').treegrid('refresh',row.id);
}

function openNode(row){
    removeChildrenNode(row)

    connectEtcdServer(row.data, function (data) {

        if(data.status ==0 ){

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

                if(row.data.authorized_enabled=='1'){
                    saveAuthorization(row.data.id, data.token);
                }


            }else{
                $.app.show("错误的节点不能打开")
            }

        }else{
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
            if(row == null)
                return ;

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

            if(row == null)
                return ;

            openMenu(e, row)
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
                connectEtcdServer(info, function (data) {
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

                let rtn = saveNode2Local(info)

                if(typeof rtn == 'string'){
                    $.app.alert(rtn)
                }else{
                    if(rtn >=0){
                        let old = $('#databaseDg').treegrid('find',info.id);
                        if(old){
                            old.data = info;
                            old.text = info.node_name;
                            $('#databaseDg').treegrid('refresh',info.id);
                        }
                    }else{
                        $('#databaseDg').treegrid('append', {
                            data: [Node2Data(info)]
                        })

                        $('#databaseDg').treegrid('find',info.id).children = newEtcdNode(info.id);

                    }

                    $.iDialog.closeOutterDialog($(this))
                }

                return false
            },
        }]
    });
}


function modifyUserPwd() {
    var opts = {
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
        removeNode2Local(row.id);
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
    loadLocalConfig()
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
                $(this).dialog('setTitle', '新增集合'+data.group_name.jsEncode())
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

                kvRange(function (node, response) {
                    if(checkCommandResponse(response)){
                        $.app.info('测试成功，记录条数为' + response.count)
                    }
                }, getCurrentOpenMenuNodeId(), info.group_prefix, null, true, true, null, null);

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

                let msg = addGroup2Node(getCurrentOpenMenuNodeId(), info);

                if($.extends.isEmpty(msg)){
                    $.app.show("添加集合成功");
                    $('#databaseDg').treegrid('append', {
                        parent: getCurrentOpenMenuRow().id,
                        data:[Group2Data(info)]
                    });
                    //$('#databaseDg').treegrid('refresh', getCurrentOpenMenuRow().id);
                    $('#databaseDg').treegrid('expand', getCurrentOpenMenuRow().id);
                    $.iDialog.closeOutterDialog($(this))
                }else{
                    $.app.show("不能添加集合，"+info);
                }

                return false
            }
        }]
    });
}

function removeGroup(){
    let row = getCurrentOpenMenuRow()
    let pid = $('#databaseDg').treegrid('getParent', row.id).id

    $.app.confirm("确定删除集合'"+row.text.jsEncode()+"'", function (){
        removeGroupFromLocal(row.node_id, row.id)
        $('#databaseDg').treegrid('remove', row.id)
        $('#databaseDg').treegrid('refresh', pid)
    })
}

function createGroupDg(){
    let dbId = getCurrentOpenMenuNodeId();
    let data = {};
    data.db_id = dbId;
    groupDg(data)
}