function loadLock(){

    let node = $.v3browser.menu.getCurrentTabAttachNode();

    $(function(){
        $("#lockDg").iDatagrid({
            idField: 'id',
            sortOrder:'asc',
            sortName:'key',
            pageSize:10,
            frozenColumns:[[
                {field: 'id', title: '', checkbox: true},
                {field: 'op', title: '操作', sortable: false, halign:'center',align:'center',
                    width: 150, formatter:lockOperateFormatter},
                {field: 'key', title: '锁对象', sortable: true,
                    formatter:$.iGrid.buildformatter([$.iGrid.templateformatter('{key}'), $.iGrid.tooltipformatter()]),
                    width: 400},
            ]],
            onBeforeLoad:function (param){
                console.log(param)
                refreshLock(param)
            },
            columns: [[
                {field: 'client', title: '持锁者', sortable: false,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 170},
                {field: 'leaseid', title: '持锁契约', sortable: true,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 200},
                {field: 'time', title: '上锁时间', sortable: true,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 170},
                {field: 'requests', title: '活动进程', sortable: false,
                    formatter:$.iGrid.tooltipformatter(),width: 900}
            ]],
            onLoadSuccess:$.easyui.event.wrap(
                $.fn.iDatagrid.defaults.onLoadSuccess,
                function(data){
                    console.log("###");
                    let dg = this;
                    if(data.rows){
                        $.each(data.rows, function (idx, val) {
                            $.etcd.request.lock.lockinfo(function (response) {
                                console.log(response)

                                let list = $.extends.collect(response.requests, function (val) {
                                    return val.client;
                                })

                                $(dg).datagrid('updateRow', {
                                    index: idx,
                                    row: {
                                        requests: list.join(";"),
                                        info: response
                                    }
                                })
                            }, node, val.key)
                        });
                    }
                }
            ),
        });
    });
}


function lockOperateFormatter(value, row, index) {
    let htmlstr = "";
    htmlstr += '<button class="layui-btn-gray layui-btn layui-btn-xs" onclick="removeLock(\'' + index + '\',\''
        + row.leaseid +'\')">强制解锁</button>';

    return htmlstr;
}

function removeLock(idx, leaseid){

    let row = $('#lockDg').datagrid('getRows')[idx];
    let node = $.v3browser.menu.getCurrentTabAttachNode();

    $.app.confirm('确定要强制解锁当前持锁在者'+row.client, function (){
        $.etcd.request.lock.unlock(function (response) {
            $.app.show('强制解锁当前持锁在者'+row.client+ '成功')
            $('#lockDg').datagrid('reload')
        }, node, row.key, leaseid);
    });
}

function refreshLock(param){

    let sortOrder = "NONE";

    if(param.order=='asc')
        sortOrder = "ASCEND"
    else if(param.order=='desc')
        sortOrder = "DESCEND"

    let sortTarget = null;

    if(param.sort=='_ID')
        sortTarget = "KEY"

    if(param.rows == null||param.rows<=0){
        param.rows = 20;
    }

    let skip;

    if(param.page == null || param.page<=0){
        skip = 0
    }else{
        skip = (param.page - 1) * param.rows;
    }

    let node = $.v3browser.menu.getCurrentTabAttachNode();

    $.etcd.request.lock.list(function (response) {
        $('#lockDg').datagrid('loadData', {
            total: response.total,
            rows: response.ids
        })
    }, node, skip, param.rows, param.lock_key, sortOrder, sortTarget);
}