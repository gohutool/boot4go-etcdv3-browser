


/// For User
function addUser(){
    $.iDialog.openDialog({
        text: '添加',
        minimizable:false,
        width: 600,
        height: 240,
        content: `
            <div style="margin: 10px;">
            </div>
            <div class="cubeui-fluid" id="create-group-form">
                <input type="hidden" name="folder_id" value="{{:id}}">
                <input type="hidden" name="db_id" value="{{:db_id}}">
                <div class="cubeui-row">
                
                        <label class="cubeui-form-label">用户名:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textbox" name="username"
                                   value='' data-options="required:true,prompt:'用户名，选择填写',
                                   validType:['length[2,50]']">
                        </div>
                    
                </div>
                
                <div class="cubeui-row">      
                        <label class="cubeui-form-label">密码:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-passwordbox" id="user_add_password" name="password"
                            data-options="required:true,prompt:'密码，必须填写'"
                                   value=''>
                        </div>
                </div>
               
                
                <div class="cubeui-row">      
                        <label class="cubeui-form-label">确认密码:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-passwordbox" name="password2"
                            data-options="
                            required:true,prompt:'确认密码，必须填写',validType:['equals[&#34;#user_add_password&#34;]']
                            "
                                   value=''>
                        </div>
                </div>
                
        `,
        render:function(opts, handler){
            let d = this;
            console.log("Open dialog");

            handler.render({})


            $(this).dialog('setTitle', '添加新用户')
        },
        buttonsGroup:[{
            text: '添加',
            iconCls: 'fa fa-plus',
            btnCls: 'cubeui-btn-blue',
            handler:'ajaxForm',
            beforeAjax:function(o){
                let t = this;
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                let info = o.ajaxData

                let node = $.v3browser.menu.getCurrentOpenMenuNode();
                $.etcd.request.auth.user.add(function(response){
                    $.app.show('用户添加成功')
                    $.iDialog.closeOutterDialog($(t))
                    refreshUsers();

                }, node, info.username, info.password);

                return false
            },
        }]
    });
}


/// For User
function changePwd(){
    $.iDialog.openDialog({
        text: '更改密码',
        minimizable:false,
        width: 600,
        height: 240,
        content: `
            <div style="margin: 10px;">
            </div>
            <div class="cubeui-fluid" id="create-group-form">
                <input type="hidden" name="folder_id" value="{{:id}}">
                <input type="hidden" name="db_id" value="{{:db_id}}">
                <div class="cubeui-row">
                
                        <label class="cubeui-form-label">用户名:</label>
                        <div class="cubeui-input-block">
                            <input type="text" readonly data-toggle="cubeui-textbox" 
                                   value='{{:username}}' data-options="required:true,prompt:'用户名，选择填写'">
                        </div>
                    
                </div>
                
                <div class="cubeui-row">      
                        <label class="cubeui-form-label">密码:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-passwordbox" id="user_add_password" name="password"
                            data-options="required:true,prompt:'密码，必须填写'"
                                   value=''>
                        </div>
                </div>
               
                
                <div class="cubeui-row">      
                        <label class="cubeui-form-label">确认密码:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-passwordbox" name="password2"
                            data-options="
                            required:true,prompt:'确认密码，必须填写',validType:['equals[&#34;#user_add_password&#34;]']
                            "
                                   value=''>
                        </div>
                </div>                
        `,
        render:function(opts, handler){
            console.log("Open dialog");

            let row = $.v3browser.menu.getCurrentOpenMenuRow();
            handler.render({username: row.text})

            $(this).dialog('setTitle', '更改密码')
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
                $.etcd.request.auth.user.change_password(function(response){
                    $.app.show('用户密码更改成功')
                    $.iDialog.closeOutterDialog($(t))
                    //refreshUsers();
                }, node, row.text, info.password);

                return false
            },
        }]
    });
}

function editUserDg(){
    let r = $.v3browser.menu.getCurrentOpenMenuRow();
    let node = $.v3browser.model.getLocalNode(r.node_id)

    let title = $.v3browser.model.title.user(r.text, node)

    $.v3browser.menu.addOneTabAndRefresh(title, './auth/user.html', 'fa fa-user-circle-o', node, r);
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

    $.etcd.request.auth.user_list(function (response) {

        if($.etcd.response.check(response)){
            $.app.show('刷新用户成功，用户个数为' + response.users.length);

            let datas = [];
            $.each(response.users, function (idx, user) {
                let one = $.v3browser.model.convert.User2Data(user, dbId);
                one.event = function(r){
                    let node = $.v3browser.model.getLocalNode(r.node_id)

                    let title = $.v3browser.model.title.user(r.text, node)

                    $.v3browser.menu.addOneTabAndRefresh(title, './auth/user.html', 'fa fa-user-circle-o', node, r);
                }
                datas.push(one)
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

function removeUser(){
    let row = $.v3browser.menu.getCurrentOpenMenuRow()

    if(row.text.toUpperCase() == 'ROOT'){
        $.app.show('用户\'root\'是系统保留用户，不能删除');
        return false;
    }

    $.app.confirm("确定删除用户'"+row.text.jsEncode()+"'", function (){
        let node = $.v3browser.menu.getCurrentOpenMenuNode();
        let username = row.text;

        $.etcd.request.auth.user.delete(function (response) {
            let title = $.v3browser.model.title.user(row.text, $.v3browser.model.getLocalNode(row.node_id))
            $.v3browser.menu.closeTab(title);

            $.app.show('用户删除成功');

            refreshUsers();
        }, node, username);
    })
}

function viewAuth(){
    let node = $.v3browser.menu.getCurrentOpenMenuNode();
    $.etcd.request.auth.status(function (response) {

        if(response.enabled == true){
            $.app.info('当前连接节点已开启认证模式')
        }else{
            $.app.info('当前连接节点已关闭认证模式')
        }

    }, node);
}

function enableAuth(){
    let node = $.v3browser.menu.getCurrentOpenMenuNode();
    $.etcd.request.auth.enable(function (response) {
        $.app.show('认证模式已开启成功')
    }, node);
}

function disableAuth(){
    let node = $.v3browser.menu.getCurrentOpenMenuNode();
    $.etcd.request.auth.disable(function (response) {
        $.app.show('认证模式已关闭成功')
    }, node);
}
/// For User end
