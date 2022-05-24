let isSearch = false

function loadSearch(){

    $('#search_with_prefix').switchbutton('options').onChange = function(checked){
        if(checked){
            $('#search_ignore_key').switchbutton('disable')
            $("#search_range_end").textbox('disable')
        }else{
            $('#search_ignore_key').switchbutton('enable')
            $("#search_range_end").textbox('enable')
        }
    }

    $('#search_ignore_key').switchbutton('options').onChange = function(checked){
        if(checked){
            $("#search_prefix").textbox('disable')
            $("#search_range_end").textbox('disable')
            $('#search_with_prefix').switchbutton('disable')
        }else{
            $("#search_prefix").textbox('enable')
            $("#search_range_end").textbox('enable')
            $('#search_with_prefix').switchbutton('enable')
        }
    }

    $('#search_key_only').switchbutton('options').onChange = function(checked){
        if(checked){
            $('#search_count_only').switchbutton('disable')
        }else{
            $('#search_count_only').switchbutton('enable')
        }
    }

    $('#search_count_only').switchbutton('options').onChange = function(checked){
        if(checked){
            $('#search_key_only').switchbutton('disable')
            $('#search_count').numberspinner('disable')
            $('#search_sort_target').combobox('disable')
            $('#search_sort_order').combobox('disable')
        }else{
            $('#search_key_only').switchbutton('enable')
            $('#search_count').numberspinner('enable')
            $('#search_sort_target').combobox('enable')
            $('#search_sort_order').combobox('enable')
        }
    }


    let row = $.extend({}, $.v3browser.menu.getCurrentTabAttachData());

    if(row.data==null)
        row.data = {};

    if(row.data['with_prefix']){
        $('#search_with_prefix').switchbutton('check')
    }

    if(row.data['ignore_key']){
        $('#search_ignore_key').switchbutton('check')
    }

    if(row.data['count_only']){
        $('#search_count_only').switchbutton('check')
    }

    if(row.data['key_only']){
        $('#search_key_only').switchbutton('check')
    }


    $(function(){
        $("#searchDg").iDatagrid({
            idField: 'id',
            sortOrder1:'asc',
            sortName1:'key',
            frozenColumns:[[
                // {field: 'id', title: '', checkbox: true},
                {field: 'op', title: '操作', sortable: false, halign:'center',align:'center', width: 140, formatter:search_operateFormatter},
                {field: 'key', title: '键', sortable: true,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 400},
            ]],
            onBeforeLoad:function (param){
                console.log(param)
                console.log('##############################')
                if(isSearch)
                    refreshSearch(param);
            },
            columns: [[
                {
                    field: 'value',
                    title: '键值',
                    sortable: true,
                    width: 440,
                    formatter:$.iGrid.tooltipformatter()
                },
                {
                    field: 'lease',
                    title: '租约',
                    sortable: false,
                    width: 180,
                    formatter:$.iGrid.tooltipformatter()
                },
                {
                    field: 'version',
                    title: '版本',
                    sortable: true,
                    width: 70,
                    halign:'right',
                    align:'right',
                    formatter:$.iGrid.tooltipformatter()
                },
                {
                    field: 'create_revision',
                    title: '创建修订号',
                    sortable: true,
                    halign:'right',
                    align:'right',
                    width: 120,
                    formatter:$.iGrid.tooltipformatter()
                },
                {
                    field: 'mod_revision',
                    title: '更新修订号',
                    sortable: true,
                    halign:'right',
                    align:'right',
                    width: 120,
                    formatter:$.iGrid.tooltipformatter()
                }
            ]],
        });


        if(row.refresh){
            doSearch();
        }
    });


}

function search_operateFormatter(value, row, index) {
    let htmlstr = "";

    htmlstr += '<button class="layui-btn-blue layui-btn layui-btn-normal layui-btn-xs" onclick="editKey(\'' + row.id + '\')">修改</button>';
    htmlstr += '<button class="layui-btn-gray layui-btn layui-btn-xs" onclick="delKey(\'' + row.id + '\')">删除</button>';

    return htmlstr;
}

function doSearch(){
    if($('#searchform').form('validate')){
        let param = $.extends.getFormJson($('#searchform'))
        console.log(param)
        isSearch = true;

        if(!$.extends.isEmpty(param.sort_order)){
            if(param.sort_order=='ASCEND'){
                $('#searchDg').datagrid('options').sortOrder = 'asc';
            }else if(param.sort_order=='DESCEND'){
                $('#searchDg').datagrid('options').sortOrder = 'desc';
            }
        }

        if(!$.extends.isEmpty(param.sort_target)){
            $('#searchDg').datagrid('options').sortName = param.sort_target.toLowerCase()
        }

        $('#searchDg').datagrid('options').param = {};

        $('#searchDg').datagrid('load', param)
    }else{
        $.app.show('填写信息不规范，请检查填写数据内容')
    }
}


function refreshSearch(param){
    let node = $.v3browser.menu.getCurrentTabAttachNode();

    let prefix = param.prefix;

    let sortOrder = null;

    if(param.order=='asc')
        sortOrder = "ASCEND"
    else if(param.order=='desc')
        sortOrder = "DESCEND"

    let sortTarget = null;

    if(param.sort=='key')
        sortTarget = "KEY"
    else if(param.sort=='create_revision')
        sortTarget = "CREATE"
    else if(param.sort=='mod_revision')
        sortTarget = "MOD"
    else if(param.sort=='value')
        sortTarget = "VALUE"
    else if(param.sort=='version')
        sortTarget = "VERSION"

    if(!$.extends.isEmpty(sortOrder)){
        param.sort_order = sortOrder
    }

    if(!$.extends.isEmpty(sortTarget)){
        param.sort_target = sortTarget
    }

    console.log(sortOrder)

    let skip;

    if(param.rows == null){
        param.rows = 20;
    }

    if(param.page == null || param.page<=0){
        skip = 0
    }else{
        skip = (param.page - 1) * param.rows;
    }

    if(!$.extends.isEmpty(param.prefix)){
        prefix = param.prefix.trim()
    }

    $.etcd.request.kv.range(function (response) {
        $('#searchDg').datagrid('loadData', {
            total: response.count,
            rows: response.kvs
        })
    }, node, prefix, param.range_end, param['with_prefix'], param['count_only'], param['sort_order'], param['sort_target'],
        skip, param.rows, param['min_create_revision'], param['min_mod_revision'], param['max_create_revision'],
        param['max_mod_revision'], param['key_only'], param['ignore_key'])
}

function saveSearch(){

    if($('#searchform').form('validate')) {
        let node = $.v3browser.menu.getCurrentTabAttachNode();
        let row = $.v3browser.menu.getCurrentTabAttachData();

        let search = $.extends.getFormJson($('#searchform'))
        console.log(search)

        search.node_id = node.id;
        search.search_name = row.data.search_name;
        search.id = row.id;

        let msg = parent.$.v3browser.model.saveSearch2Node(node.id, search);
        $.extend(parent.$.v3browser.menu.getTreeRow(row.id).data, search);
        $.app.show('保存查询成功')

    }else{
        $.app.show('填写信息不规范，请检查填写数据内容')
    }
}

function saveSearchAs(){


    if($('#searchform').form('validate')){

        $.iDialog.openDialog({
            title: '保存为',
            minimizable:false,
            width: 750,
            height: 240,
            content: `
            <div style="margin: 10px;">
            </div>
            <div class="cubeui-fluid" id="create-group-form">
                <div class="cubeui-row">
                
                    <div class="cubeui-col-sm11">
                        <label class="cubeui-form-label">名称:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textbox" id="search_name" name="search_name"
                                   value='{{:search_name}}' data-options="required:true,prompt:'查询名称，必须填写'">
                        </div>
                    </div>
                </div>
            </div>
            
        `,
            render:function(opts, handler){
                let d = this;
                console.log("Open dialog");
                handler.render({})
            },
            buttonsGroup: [{
                text: '保存',
                iconCls: 'fa fa-plus-square-o',
                btnCls: 'cubeui-btn-orange',
                handler:'ajaxForm',
                beforeAjax:function(o){
                    let node = $.v3browser.menu.getCurrentTabAttachNode();
                    o.ajaxData = $.extends.json.param2json(o.ajaxData);
                    let info = o.ajaxData

                    let search = $.extends.getFormJson($('#searchform'))
                    console.log(search)

                    search.node_id = node.id;
                    search.search_name = info.search_name;

                    let msg = $.v3browser.model.saveSearch2Node(node.id, search);

                    if(typeof msg == 'string'){
                        $.app.show("不能添加查询，"+msg);
                    }

                    let one = $.v3browser.model.convert.Search2Data(search);
                    let row = parent.$.v3browser.menu.getTreeRow($.v3browser.menu.systemMenu.searchMenuId(node.id))
                    one.parentRow = row;
                    one.event = function(r){
                        let node = $.v3browser.model.getLocalNode(r.node_id)

                        //let title = r.text.jsEncode()+'@'+node.node_name.jsEncode()+'-集合';
                        let title = $.v3browser.model.title.search(info, node)
                        $.v3browser.menu.addOneTabAndRefresh(title, './kv/search.html', 'fa fa-navicon', node, r);
                    }

                    parent.openSearchNodeMenu(row)

                    parent.$('#databaseDg').treegrid('append', {
                        parent: row.id,
                        data:[one]
                    });
                    parent.$('#databaseDg').treegrid('enableDnd',one.id);

                    parent.$('#databaseDg').treegrid('expand', row.id);
                    $.iDialog.closeOutterDialog($(this))
                    $.app.show('保存查询成功')
                    return false;
                }
            }]
        });

    }else{
        $.app.show('填写信息不规范，请检查填写数据内容')
    }

}

function delKey(key){
    let node = $.v3browser.menu.getCurrentTabAttachNode();

    key = Base64.decode(key);

    $.app.confirm('确定删除当前的键值\''+key.jsEncode()+'\'', function (){
        $.etcd.request.kv.del(function (response){
            $.app.show("键值删除成功");
            $('#searchDg').datagrid('reload')
        }, node, key,  false)
    })
}

function addKey() {
    _keyDlg({});
}

function editKey(key) {
    let node = $.v3browser.menu.getCurrentTabAttachNode();
    key = Base64.decode(key);

    $.etcd.request.kv.range(function (response) {

        if($.extends.isEmpty(response.kvs)){
            $.app.show('当前键值不存在，请刷新后进行操作');
            return ;
        }else{
            let d = {}
            d.key = key;
            d.value = response.kvs[0].value;
            d.lease = response.kvs[0].lease?response.kvs[0].lease:'';

            _keyDlg(d);
        }

    }, node, key, null, false, false)
}

function _keyDlg(data){
    $.iDialog.openDialog({
        title: '编辑',
        maximized1:true,
        minimizable:false,
        width: 900,
        height: 640,
        render:function(opts, handler){
            let d = this;
            console.log("Open dialog")
            handler.render(data)


            $("#with_auto_leaase").switchbutton('options').onChange = function(checked){
                if(checked){
                    $("#edit_lease").textbox('disable')
                    $("#with_auto_leaase_ttl").numberspinner('enable')
                }else{
                    $("#edit_lease").textbox('enable')
                    $("#with_auto_leaase_ttl").numberspinner('disable')
                }
            }

            if(!$.extends.isEmpty(data.key)){
                $(this).dialog('setTitle', '更新键值')
                $("#ignore_lease").switchbutton('enable')
                $("#ignore_value").switchbutton('enable')


                $("#ignore_value").switchbutton('options').onChange = function(checked){
                    if(checked){
                        $("#edit_value").numberspinner('disable')
                    }else{
                        $("#edit_value").numberspinner('enable')
                    }
                }

                $("#ignore_lease").switchbutton('options').onChange = function(checked){
                    if(checked){
                        $("#edit_lease").numberspinner('disable')
                        $("#with_auto_leaase").switchbutton('disable');
                    }else{

                        if(!$("#with_auto_leaase").switchbutton('options').checked)
                            $("#edit_lease").numberspinner('enable')

                        $("#with_auto_leaase").switchbutton('enable');
                    }
                }

                if(!$.extends.isEmpty(data.lease)){
                    $("#with_auto_leaase").switchbutton('uncheck');
                    $("#with_auto_leaase_ttl").numberspinner('disable')
                }else{
                }

            } else{
                $(this).dialog('setTitle', '新增键值')
            }
        },
        href: contextpath + '/kv/searchkey.html?id=',
        buttonsGroup: [{
            text: !$.extends.isEmpty(data.key)?'保存':'添加',
            iconCls: 'fa fa-save',
            btnCls: 'cubeui-btn-blue',
            handler:'ajaxForm',
            beforeAjax:function(o){
                let info = $.extends.json.param2json(o.ajaxData);
                console.log(info)

                let node = $.v3browser.menu.getCurrentTabAttachNode();

                let dlg = this;

                $.etcd.request.kv.put(function(response){
                        $.app.show(!$.extends.isEmpty(data.key)?'保存键值成功':'添加键值成功');
                        $.iDialog.closeOutterDialog($(dlg));
                        $('#searchDg').datagrid('reload');
                    }, node, info.key, info.value, info.lease,
                    $.extends.isEmpty(info.ignore_value)?false:true,
                    $.extends.isEmpty(info.ignore_lease)?false:true, info.ttl)

                return false;
            },
        }]
    });
}