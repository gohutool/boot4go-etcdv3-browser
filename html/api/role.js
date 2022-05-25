
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


function removeRole(){
    let row = $.v3browser.menu.getCurrentOpenMenuRow()
    let pid = $('#databaseDg').treegrid('getParent', row.id).id

    if(row.text.toUpperCase() == 'ROOT'){
        $.app.show('角色\'root\'是系统保留角色，不能删除');
        return false;
    }

    $.app.confirm("确定删除角色'"+row.text.jsEncode()+"'", function (){
        let title = $.v3browser.model.title.role(row.data, $.v3browser.model.getLocalNode(row.node_id))
        $.v3browser.menu.closeTab(title);

        $('#databaseDg').treegrid('remove', row.id)
        $('#databaseDg').treegrid('refresh', pid);

    })
}

/// For Role end