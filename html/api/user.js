


/// For User
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

/// For User end
