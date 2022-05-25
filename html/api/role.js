
/// For Role
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

    $.etcd.request.auth.role_list(function (response) {

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


/// For Role
function addRole(){

    $.iDialog.openDialog({
        text: '添加角色',
        minimizable:false,
        width: 600,
        height: 240,
        content: `
            <div style="margin: 10px;">
            </div>
            <div class="cubeui-fluid" id="create-group-form">
                <div class="cubeui-row">
                
                        <label class="cubeui-form-label">角色名:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textbox" name="rolename" 
                                   value='' data-options="required:true,prompt:'角色名，选择填写'">
                        </div>
                    
                </div>                      
        `,
        render:function(opts, handler){
            console.log("Open dialog");

            let row = $.v3browser.menu.getCurrentOpenMenuRow();
            handler.render({})

            $(this).dialog('setTitle', '添加角色')
        },
        buttonsGroup:[{
            text: '确定',
            iconCls: 'fa fa-plus',
            btnCls: 'cubeui-btn-blue',
            handler:'ajaxForm',
            beforeAjax:function(o){
                let t = this;
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                let info = o.ajaxData

                let row = $.v3browser.menu.getCurrentOpenMenuRow();

                let node = $.v3browser.menu.getCurrentOpenMenuNode();
                $.etcd.request.auth.role.add(function(response){
                    $.app.show('角色添加成功')
                    $.iDialog.closeOutterDialog($(t))
                    refreshRoles();
                }, node, info.rolename);

                return false
            },
        }]
    });
}

function removeRole(){
    let row = $.v3browser.menu.getCurrentOpenMenuRow()

    if(row.text.toUpperCase() == 'ROOT'){
        $.app.show('角色\'root\'是系统保留角色，不能删除');
        return false;
    }

    $.app.confirm("确定删除角色'"+row.text.jsEncode()+"'", function (){
        let node = $.v3browser.menu.getCurrentOpenMenuNode();
        let username = row.text;

        $.etcd.request.auth.role.delete(function (response) {
            let title = $.v3browser.model.title.role(row.text, $.v3browser.model.getLocalNode(row.node_id))
            $.v3browser.menu.closeTab(title);

            $.app.show('角色删除成功');

            refreshRoles();
        }, node, username);
    })
}

/// For Role end