function load(){
    $(function(){
        $("#groupDg").iDatagrid({
            idField: 'id',
            sortOrder:'asc',
            sortName:'key',
            frozenColumns:[[
                // {field: 'id', title: '', checkbox: true},
                {field: 'op', title: '操作', sortable: false, halign:'center',align:'center', width: 140, formatter:operateFormatter},
                {field: 'key', title: '键', sortable: true,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 400},
            ]],
            onBeforeLoad:function (param){
                console.log(param)
                queryKv(null, param);
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
    });
}

function operateFormatter(value, row, index) {
    let htmlstr = "";

    htmlstr += '<button class="layui-btn-blue layui-btn layui-btn-normal layui-btn-xs" onclick="editKey(\'' + row.id + '\')">修改</button>';
    htmlstr += '<button class="layui-btn-gray layui-btn layui-btn-xs" onclick="delKey(\'' + row.id + '\')">删除</button>';

    return htmlstr;
}

function queryKv(prefix, param){
    let node = $.v3browser.menu.getCurrentTabAttachNode();
    let data = $.v3browser.menu.getCurrentTabAttachData();

    if($.extends.isEmpty(prefix))
        prefix = data.prefix;

    let sortOrder = 'NONE'
    if(param.order=='asc')
        sortOrder = "ASCEND"
    else if(param.order=='desc')
        sortOrder = "DESCEND"

    let sortTarget = "KEY";
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

    let skip = 0;

    if(param.rows == null){
        param.rows = 20;
    }

    if(param.page == null || param.page<=0){
        skip = 0
    }else{
        skip = (param.page - 1) * param.rows;
    }

    if(!$.extends.isEmpty(param.key)){
        prefix = prefix+param.key.trim()
    }

    $.etcd.request.kv.range(function (response) {
        $('#groupDg').datagrid('loadData', {
            total: response.count,
            rows: response.kvs
        })
    }, node, prefix, null, true, false, sortOrder, sortTarget, skip, param.rows)
}

function delKey(key){
    let node = $.v3browser.menu.getCurrentTabAttachNode();
    key = Base64.decode(key);
    $.app.confirm('确定删除当前的键值\''+key.jsEncode()+'\'', function (){
        $.etcd.request.kv.del(function (response){
            $.app.show("键值删除成功");
            reloadDg();
        }, node, key,  false)
    })
}

function emptyKeys(){
    let node = $.v3browser.menu.getCurrentTabAttachNode();
    let data = $.v3browser.menu.getCurrentTabAttachData();
    let prefix = data.data.group_prefix;

    $.app.confirm('确定清空当前集合\''+prefix.jsEncode()+'\'前缀所有的键值', function (){
        $.etcd.request.kv.del(function (response){
            $.app.show("清空当前集合成功");
            reloadDg();
        }, node, prefix,  true)
    })
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
                    $("#with_auto_leaase_ttl").numberspinner('enable')
                    $("#edit_lease").textbox('disable')
                }else{
                    $("#with_auto_leaase_ttl").numberspinner('disable')
                    $("#edit_lease").textbox('enable')
                }
            }

            if(!$.extends.isEmpty(data.key)){
                $(this).dialog('setTitle', '更新键值')
                $("#edit_key").textbox('readonly', true)
                $("#ignore_value").switchbutton('enable')
                $("#ignore_lease").switchbutton('enable')


                $("#ignore_lease").switchbutton('options').onChange = function(checked){

                    if(checked){
                        $("#with_auto_leaase").switchbutton('disable');
                        $("#edit_lease").numberspinner('disable')
                    }else{

                        if(!$("#with_auto_leaase").switchbutton('options').checked)
                            $("#edit_lease").numberspinner('enable')

                        $("#with_auto_leaase").switchbutton('enable');
                    }
                }

                $("#ignore_value").switchbutton('options').onChange = function(checked){
                    if(checked){
                        $("#edit_value").numberspinner('disable')
                    }else{
                        $("#edit_value").numberspinner('enable')
                    }
                }

                if(!$.extends.isEmpty(data.lease)){
                    $("#with_auto_leaase").switchbutton('uncheck');
                    $("#with_auto_leaase_ttl").numberspinner('disable')
                }else{
                }

            } else{
                $(this).dialog('setTitle', '新增键值')
                $("#edit_key").textbox('readonly', false)
            }
        },
        href: contextpath + '/kv/add.html?id=',
        buttonsGroup: [{
            text: !$.extends.isEmpty(data.key)?'保存':'添加',
            iconCls: 'fa fa-save',
            btnCls: 'cubeui-btn-blue',
            handler:'ajaxForm',
            beforeAjax:function(o){
                let info = $.extends.json.param2json(o.ajaxData);
                console.log(info)

                let node = $.v3browser.menu.getCurrentTabAttachNode();
                let data = $.v3browser.menu.getCurrentTabAttachData();

                let t = this;

                $.etcd.request.kv.put(function(response){
                    $.app.show(!$.extends.isEmpty(data.key)?'保存键值成功':'添加键值成功');
                    $.iDialog.closeOutterDialog($(t));
                    reloadDg();
                }, node, data.prefix+info.key, info.value, info.lease,
                    $.extends.isEmpty(info.ignore_value)?false:true,
                    $.extends.isEmpty(info.ignore_lease)?false:true, info.ttl)

                return false;
            },
        }]
    });
}

function editKey(key) {
    let node = $.v3browser.menu.getCurrentTabAttachNode();
    let data = $.v3browser.menu.getCurrentTabAttachData();
    key = Base64.decode(key);

    $.etcd.request.kv.range(function (response) {

        if($.extends.isEmpty(response.kvs)){
            $.app.show('当前键值不存在，请刷新后进行操作');
            return ;
        }else{
            let d = {}
            d.prefix = data.prefix;
            d.key = key.substring(d.prefix.length)
            d.value = response.kvs[0].value;
            d.lease = response.kvs[0].lease?response.kvs[0].lease:'';

            _keyDlg(d);
        }

    }, node, key, null, false, false)
}

function addKey(){
    let data = $.v3browser.menu.getCurrentTabAttachData();
    _keyDlg({prefix:data.prefix})
}

function reloadDg(){
    $('#groupDg').datagrid('reload');
}