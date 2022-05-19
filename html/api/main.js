
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

//// For utility
function removeSubTree(id) {
    let nodes = $('#databaseDg').treegrid('getChildren', id);
    if (nodes == null)
        return;
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

function findGroupRowParents(row){
    let node = $.v3browser.model.getLocalNode(row.node_id);

    if(node.group==null)
        return [];

    let rtn = [];

    while(row.parentRow && row.parentRow=='folder'){
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
                idxRtn.push({index:idx, row: val, data: list[idx]})
                list = list[idx].group || [];
            }else{
                return false;
            }
        }
        else
            return false;
    });

    return idxRtn;
}
//// For utility end



function buildGroupTreeDatas(node, datas, parentRow){
    if(datas==null)
        datas = [];

    let ds = [];

    if(datas){
        $.each(datas, function (idx,data){
            if($.v3browser.model.getDataType(data) == 'group'){
                let one = $.v3browser.model.convert.Group2Data(data);
                one.event = function(r){
                    let node = $.v3browser.model.getLocalNode(r.node_id)

                    let title = $.v3browser.model.title.group(r.data, node)
                    $.v3browser.menu.addOneTabAndRefresh(title, './kv/group.html', 'fa fa-list-alt', node, r);
                }
                one.parentRow = parentRow;
                ds.push(one);
            }
            else if($.v3browser.model.getDataType(data) == 'folder'){
                let one = $.v3browser.model.convert.Folder2Data(data);
                one.event = function(r){
                    $('#databaseDg').treegrid('toggle', r.id);
                    return ;
                }
                one.children = buildGroupTreeDatas(node, data.group, one);
                one.parentRow = parentRow;
                ds.push(one);
            }
        });
    }
    return ds;
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

