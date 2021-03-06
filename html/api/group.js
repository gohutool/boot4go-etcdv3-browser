
/// For Group

function groupDg(data){

    let isUpdate = !($.extends.isEmpty(data)||$.extends.isEmpty(data.id));

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

                $.etcd.request.kv.range(function (response) {
                    if($.etcd.response.check(response)){
                        $.app.show('测试成功，记录条数为' + response.count)
                    }
                }, $.v3browser.menu.getCurrentOpenMenuNode(), info.group_prefix, null, true, true, null, null);

                return false
            },
        }],
        buttonsGroup: [{
            text: isUpdate?'修改':'添加',
            iconCls: 'fa fa-plus-square-o',
            btnCls: 'cubeui-btn-orange',
            handler:'ajaxForm',
            beforeAjax:function(o){

                let row = $.v3browser.menu.getCurrentOpenMenuRow();
                if(row.type=='groups'&&!isUpdate){
                    openGroupsNodeMenu(row)
                }

                console.log("添加")
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                let info = o.ajaxData

                let msg = $.v3browser.model.saveGroup2Node(
                    $.v3browser.menu.getCurrentOpenMenuNodeId(), info, isUpdate?row.parentRow:row);

                if(typeof msg == 'string'){
                    $.app.show("不能添加集合，"+msg);
                }else{
                    if(msg < 0){
                        let one = $.v3browser.model.convert.Group2Data(info);
                        one.parentRow = row;
                        one.event = function(r){
                            let node = $.v3browser.model.getLocalNode(r.node_id)

                            //let title = r.text.jsEncode()+'@'+node.node_name.jsEncode()+'-集合';
                            let title = $.v3browser.model.title.group(info, node)
                            $.v3browser.menu.addOneTabAndRefresh(title, './kv/group.html', 'fa fa-list-alt', node, r);
                        }
                        $('#databaseDg').treegrid('append', {
                            parent: $.v3browser.menu.getCurrentOpenMenuRow().id,
                            data:[one]
                        });
                        $('#databaseDg').treegrid('enableDnd',one.id);

                        $('#databaseDg').treegrid('expand', $.v3browser.menu.getCurrentOpenMenuRow().id);
                    }else{
                        let old = $('#databaseDg').treegrid('find',info.id);
                        let needOpen = false;

                        let node = $.v3browser.menu.getCurrentOpenMenuNode();
                        if(old.text!=info.group_name){
                            let title = $.v3browser.model.title.group(old.data, node);
                            if($.v3browser.menu.isTabExist(title)){
                                $.v3browser.menu.closeTab(title);
                                needOpen = true;
                            }
                        }

                        if(old.data.group_prefix != info.group_prefix){
                            let title = $.v3browser.model.title.group(old.data, node);
                            if($.v3browser.menu.isTabExist(title)){
                                $.v3browser.menu.closeTab(title);
                                needOpen = true;
                            }
                        }

                        old.text = info.group_name;
                        old.prefix = info.group_prefix;
                        old.data = info;
                        $('#databaseDg').treegrid('refresh', old.id);

                        let title = $.v3browser.model.title.group(info, node);
                        if(needOpen)
                            $.v3browser.menu.addOneTabAndRefresh(title, './kv/group.html', 'fa fa-list-alt', node, old);
                        else{
                            $.v3browser.menu.refreshTab(title)
                        }
                    }
                    $.app.show(isUpdate?'修改集合成功':'添加集合成功');
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
        let title = $.v3browser.model.title.group(row.data, $.v3browser.model.getLocalNode(row.node_id))
        $.v3browser.menu.closeTab(title);

        $.v3browser.model.removeGroupFromLocal(row.node_id, row.id, row.parentRow);
        $('#databaseDg').treegrid('remove', row.id)
        $('#databaseDg').treegrid('refresh', pid);

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

function openGroupsNodeMenu(row) {

    if(row.children==null){
        let node = $.v3browser.model.getLocalNode(row.node_id);

        let ds = buildGroupTreeDatas(node, node.group, row)

        $('#databaseDg').treegrid('append', {
            parent: row.id,
            data: ds
        });

        $('#databaseDg').treegrid('enableDndChildren', row.id)

        $('#databaseDg').treegrid('expand', row.id)
    }

}

function openSearchNodeMenu(row) {

    if(row.children==null){

        let node = $.v3browser.model.getLocalNode(row.node_id);
        let ds = [];

        if(node.search == null)
            node.search = [];

        if(node.search){
            $.each(node.search, function (idx,v){
                let one = $.v3browser.model.convert.Search2Data(v);
                one.parentRow = row;
                one.event = function(r){
                    let node = $.v3browser.model.getLocalNode(r.node_id)

                    //let title = r.text.jsEncode()+'@'+node.node_name.jsEncode()+'-集合';
                    let title = $.v3browser.model.title.search(v, node)
                    let row = $.extend({}, r);
                    row.refresh = true;
                    $.v3browser.menu.addOneTabAndRefresh(title, './kv/search.html', 'fa fa-navicon', node, row);
                }
                ds.push(one);
            });
        }

        $('#databaseDg').treegrid('append', {
            parent:row.id,
            data:ds
        });

        $('#databaseDg').treegrid('enableDndChildren', row.id)

        $('#databaseDg').treegrid('expand', row.id)
    }
}
/// For Group end

function refreshGroups(){
    let node = $.v3browser.menu.getCurrentOpenMenuNode();
    let row = $.v3browser.menu.getTreeRow($.v3browser.menu.systemMenu.groupMenuId(node.id));
    removeSubTree(row.id);

    openGroupsNodeMenu(row)
}



/// For Folder
function _folderDg(data){
    let isUpdate = !($.extends.isEmpty(data)||$.extends.isEmpty(data.id));

    $.iDialog.openDialog({
        text: '添加',
        minimizable:false,
        width: 640,
        height: 300,
        content: `   
            <div style="margin: 10px;">
            </div>
            <div class="cubeui-fluid" id="create-group-form">
                <input type="hidden" name="folder_id" value="{{:id}}">
                <input type="hidden" name="db_id" value="{{:db_id}}">
                <div class="cubeui-row">
                
                    <div class="cubeui-col-sm11">
                        <label class="cubeui-form-label">名称:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textbox" id="folder_name" name="folder_name"
                                   value='{{:folder_name}}' data-options="required:true,prompt:'目录名称，必须填写'">
                        </div>
                    </div>
                </div>
            
                <div class="cubeui-row">
                
                    <div class="cubeui-col-sm11">
                        <label class="cubeui-form-label">备注:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textarea" id="folder_demo" name="folder_demo"
                                   value='{{:folder_demo}}' data-options="required:false,prompt:'目录备注信息，选择填写',
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

            if(!isUpdate){
                $(this).dialog('setTitle', '添加目录')
            }else{
                //$(this).dialog('setTitle', '修改集合'+data.group_name.jsEncode())
                $(this).dialog('setTitle', '修改目录')
            }
        },
        buttonsGroup:[{
            text: isUpdate?'修改':'添加',
            iconCls: 'fa fa-save',
            btnCls: 'cubeui-btn-blue',
            handler:'ajaxForm',
            beforeAjax:function(o){
                let row = $.v3browser.menu.getCurrentOpenMenuRow();
                if(row.type=='groups'&&!isUpdate){
                    openGroupsNodeMenu(row)
                }

                o.ajaxData = $.extends.json.param2json(o.ajaxData);

                let info = o.ajaxData;

                console.log(info);

                if(isUpdate){
                    let msg = $.v3browser.model.saveFolder2Node(
                        $.v3browser.menu.getCurrentOpenMenuNodeId(), info, row.parentRow);
                    if(typeof msg == 'string'){
                        $.app.show("添加目录失败，"+msg);
                        return
                    }

                    let old = $('#databaseDg').treegrid('find',info.id);

                    old.text = info.folder_name;
                    $.extend(old.data, {
                        folder_name:info.folder_name,
                        folder_demo:info.folder_demo
                    });

                    $('#databaseDg').treegrid('refresh', old.id);

                }else{
                    if(row.type=='folder'||row.type=='groups'){
                        let msg = $.v3browser.model.saveFolder2Node(
                            $.v3browser.menu.getCurrentOpenMenuNodeId(), info, row);

                        if(typeof msg == 'string'){
                            $.app.show("添加目录失败，"+msg);
                            return ;
                        }else{
                            if(msg < 0){
                                let one = $.v3browser.model.convert.Folder2Data(info);
                                one.parentRow = row;
                                one.event = function(r){
                                    $('#databaseDg').treegrid('toggle', r.id);
                                }

                                $('#databaseDg').treegrid('append', {
                                    parent: $.v3browser.menu.getCurrentOpenMenuRow().id,
                                    data:[one]
                                });
                                $('#databaseDg').treegrid('enableDnd',one.id);
                                $('#databaseDg').treegrid('expand', $.v3browser.menu.getCurrentOpenMenuRow().id);

                            }else{
                                let old = $('#databaseDg').treegrid('find',info.id);

                                old.text = info.folder_name;
                                $.extend(old.data, {
                                    folder_name:info.folder_name,
                                    folder_demo:info.folder_demo
                                });

                                $('#databaseDg').treegrid('refresh', old.id);
                            }
                        }
                    }else{
                        $.app.show('只有在目录或者集合根路径下才能创建子目录')
                        return false;
                    }
                }

                $.app.show(isUpdate?'修改目录成功':'添加目录成功');
                $.iDialog.closeOutterDialog($(this))

                return false
            },
        }]
    })
}

function renameFolder(){
    let row = $.v3browser.menu.getCurrentOpenMenuRow();
    _folderDg(row.data)
}

function createFolder(){
    let dbId = $.v3browser.menu.getCurrentOpenMenuNodeId();
    let data = {};
    data.db_id = dbId;
    _folderDg(data);
}

function removeFolder(){
    let row = $.v3browser.menu.getCurrentOpenMenuRow()
    let pid = $('#databaseDg').treegrid('getParent', row.id).id

    $.app.confirm("确定删除目录'"+row.text.jsEncode()+"'", function (){
        let paths = $.v3browser.model.util.findFolderAncestorList(row);


        if(paths.length>0){
            $.v3browser.menu.closeAllGroupTabs(paths[paths.length-1].data)
        }

        $.v3browser.model.removeGroupFromLocal(row.node_id, row.id, row.parentRow)
        $('#databaseDg').treegrid('remove', row.id)
        $('#databaseDg').treegrid('refresh', pid);
    })
}
/// For Folder end


function buildGroupTreeDatas(node, datas, parentRow){
    if(datas==null)
        datas = [];

    let ds = [];

    if(datas){
        $.each(datas, function (idx,data){
            if(data==null){
                console.error('group node null');
                return true;
            }

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

function exchangeGroup(nodeId, sourceRow, targetRow, point){

    let node = $.v3browser.model.getLocalNode(nodeId);
    let group = node.group || [];
    node.group = group;

    let sourceParents = $.v3browser.model.util.findFolderAncestorList(sourceRow);
    let targetParents = $.v3browser.model.util.findFolderAncestorList(targetRow);

    let targetParentRow = targetRow.parentRow // data in treegrid
    let sourceData = null    // list data in memory
    let targetData = null   // list data in memory

    if(sourceParents==null||sourceParents.length==0){
        sourceData = group;
    }else{
        if(sourceRow.type == 'folder'){
            if(sourceParents.length>1){
                sourceData = sourceParents[sourceParents.length-2].data.group;
            }
            else{
                sourceData = group;
            }
        }else{
            sourceData = sourceParents[sourceParents.length-1].data.group;
        }
    }

    if(targetParents==null||targetParents.length==0){
        targetData = group
    }else{
        if(targetRow.type == 'folder'){
            if(targetParents.length>1){
                targetData = targetParents[targetParents.length-2].data.group;
            }
            else{
                targetData = group;
            }
        }else{
            targetData = targetParents[targetParents.length-1].data.group;
        }
    }

    if(sourceData == null){
        sourceData = [];
    }

    if(targetData == null){
        targetData = []
    }

    if(sourceRow.type == 'group'){
        if(point=='append'){
            if(targetRow.type == 'folder'){
                let targetObject = findObj(targetData, targetRow.id)
                if(targetObject.group==null)
                    targetObject.group = [];

                exchangeTwoListAfter(sourceRow.id, sourceData, null, targetObject.group)
                sourceRow.parentRow = targetRow;
            }else{
                return '不能Append到集合节点';
            }
        }else{
            if(point=='top'){
                exchangeTwoListBefore(sourceRow.id, sourceData, targetRow.id, targetData)
            }
            else{
                exchangeTwoListAfter(sourceRow.id, sourceData, targetRow.id, targetData)
            }
            sourceRow.parentRow = targetParentRow

            return null;
        }
    }else{ // folder

        let parents = $.v3browser.model.util.findFolderAncestorList(targetRow);

        if(parents==null)
            parents=[];

        let isloop = false;

        $.each(parents, function (idx, v) {
           if(v.id == sourceRow.id)
               isloop = true;
        });

        if(point=='append'){
            if(targetRow.type == 'group'){
                return '不能Append到集合节点';
            }else{

                if(isloop)
                    return '不能将folder移动到子对象里';

                let targetObject = findObj(targetData, targetRow.id)
                if(targetObject.group==null)
                    targetObject.group = [];

                exchangeTwoListAfter(sourceRow.id, sourceData, null, targetObject.group)
                sourceRow.parentRow = targetRow;
            }
        }else{
            if(point=='top')
                exchangeTwoListBefore(sourceRow.id, sourceData, targetRow.id, targetData)
            else
                exchangeTwoListAfter(sourceRow.id, sourceData, targetRow.id, targetData)

            sourceRow.parentRow = targetParentRow

            return null;
        }
    }
    return null;
}