let isSearch = false

function load(){

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

    $(function(){
        $("#searchDg").iDatagrid({
            idField: 'id',
            sortOrder1:'asc',
            sortName1:'key',
            frozenColumns:[[
                // {field: 'id', title: '', checkbox: true},
                {field: 'op', title: '操作', sortable: false, halign:'center',align:'center', width: 140, formatter:operateFormatter},
                {field: 'key', title: '键', sortable: true,
                    formatter:$.iGrid.templateformatter('{key}'),
                    width: 400},
            ]],
            onBeforeLoad:function (param){
                console.log(param)
                if(isSearch)
                    refresh(param);
            },
            columns: [[
                {
                    field: 'value',
                    title: '键值',
                    sortable: true,
                    width: 540,
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
                    width: 140,
                    formatter:$.iGrid.tooltipformatter()
                },
                {
                    field: 'mod_revision',
                    title: '更新修订号',
                    sortable: true,
                    halign:'right',
                    align:'right',
                    width: 140,
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
    }
}


function refresh(param){
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
