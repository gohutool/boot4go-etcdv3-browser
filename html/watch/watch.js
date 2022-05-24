let result = [];

function initDg(){

    $('#search_with_prefix').switchbutton('options').onChange = function(checked){
        if(checked){
            $("#search_range_end").textbox('disable')
        }else{
            $("#search_range_end").textbox('enable')
        }
    }

    let node = $.v3browser.menu.getCurrentTabAttachNode();

    $(function(){
        $("#watchDg").iDatagrid({
            idField: 'id',
            sortOrder:'asc',
            sortName:'key',
            pageSize:10,
            frozenColumns:[[
                {field: 'id', title: '', checkbox: true},
                {field: 'op', title: '操作', sortable: false, halign:'center',align:'center',
                    width: 150, formatter:keyOperateFormatter},
                {field: 'key', title: '事件键', sortable: false,
                    formatter:$.iGrid.buildformatter([$.iGrid.templateformatter('{key}'), $.iGrid.tooltipformatter()]),
                    width: 400},
                {field: 'type', title: '事件类型', sortable: false,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 170},
            ]],
            onBeforeLoad:function (param){
                console.log(param)
                buildResult(param)
            },
            columns: [[
                {field: 'kv', title: '值', sortable: false,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 400},
                {field: 'prev_kv', title: '旧值', sortable: false,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 400}
            ]],
        });
    });
}

function buildResult(param){

    if(param.rows == null){
        param.rows = 20;
    }

    let skip;

    if(param.page == null || param.page<=0){
        skip = 0
    }else{
        skip = (param.page - 1) * param.rows;
    }

    let count = param.rows;


    $('#watchDg').datagrid('loadData', {
        total: result.length,
        rows: result.slice(skip, skip+count)
    })
}


function keyOperateFormatter(value, row, index) {
    let htmlstr = "";
    htmlstr += '<button class="layui-btn-gray layui-btn layui-btn-xs" onclick="removeLock(\'' + index + '\',\''
        + row.leaseid +'\')">强制解锁</button>';

    return htmlstr;
}

function removeLock(idx, leaseid){

    let row = $('#watchDg').datagrid('getRows')[idx];
    let node = $.v3browser.menu.getCurrentTabAttachNode();

    $.app.confirm('确定要强制解锁当前持锁在者'+row.client, function (){
        $.etcd.request.lock.unlock(function (response) {
            $.app.show('强制解锁当前持锁在者'+row.client+ '成功')
            $('#watchDg').datagrid('reload')
        }, node, row.key, leaseid);
    });
}

let watchId;

function stopTest(){

    if(watchId==null){
        $.app.show('没有活动的观察点，请先启动观察点');

        $('#startWatchBtn').linkbutton('enable');
        $('#stopWatchBtn').linkbutton('disable');
        //$('#clearBtn').linkbutton('disable');
        return;
    }

    let node = $.v3browser.menu.getCurrentTabAttachNode();

    $.etcd.request.watch.stop(function(response){
    }, node, watchId);

    if(watchId!=null)
        $.app.show('观察点'+watchId+'已经停止');
    else
        $.app.show('观察点已经停止');

    $('#startWatchBtn').linkbutton('enable');
    $('#stopWatchBtn').linkbutton('disable');
    //$('#clearBtn').linkbutton('disable');

    watchId = null;
}


function test(){

    if($('#searchform').form('validate')){
        let param = $.extends.getFormJson($('#searchform'))

        let node = $.v3browser.menu.getCurrentTabAttachNode();

        watchId = new Date().getTime()

        $.etcd.request.watch.watch(function(response, xhr,state){
            console.log(xhr);
            console.log(response);

            if(response.result){

                if(response.result.watch_id!=null){
                    watchId = response.result.watch_id;
                }

                if(response.result.created){
                    if(response.result.watch_id!=null){

                        $.app.show('观测点启动成功， ID为'+response.result.watch_id);
                    }else{
                        $.app.show('观测点启动成功')
                    }

                    $('#startWatchBtn').linkbutton('disable');
                    $('#stopWatchBtn').linkbutton('enable');
                    //$('#clearBtn').linkbutton('enable');
                }

                if(response.result.events != null){
                    $.each(response.result.events, function(idx,v){
                        let row = {}
                        if(v.type==null){
                            row.type='PUT'
                        }else{
                            row.type=v.type
                        }

                        row.data=v.kv

                        if(v.kv){
                            if(v.kv.key){
                                v.kv.key = Base64.decode(v.kv.key)
                            }
                            if(v.kv.value){
                                v.kv.value = Base64.decode(v.kv.value)
                            }
                            row.id = v.kv.key
                            row.key = v.kv.key
                            row.kv = $.extends.json.tostring(v.kv);
                        }
                        else
                            row.kv = '';

                        row.prev_data=v.prev_kv

                        if(v.prev_kv){
                            if(v.prev_kv.key){
                                v.prev_kv.key = Base64.decode(v.prev_kv.key)
                            }
                            if(v.prev_kv.value){
                                v.prev_kv.value = Base64.decode(v.prev_kv.value)
                            }
                            row.prev_kv = $.extends.json.tostring(v.prev_kv);
                        }
                        else
                            row.prev_kv = '';

                        result.splice(0,0, row)
                    })

                    $('#watchDg').datagrid('reload')
                }
            }

        }, node, watchId, param.prefix, param.range_end, param.with_prefix, param.prev_kv, param.fragment,
            param.progress_notify, param.start_revision)

    }else{
        $.app.show('填写信息不规范，请检查填写数据内容')
    }
}
