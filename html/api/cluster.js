

/// For Cluster
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

    $.etcd.request.cluster.member_list(function (response) {

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

/// For Cluster end