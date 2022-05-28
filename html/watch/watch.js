let result = [];

function initDg(){
    $('#search_ignore_key').switchbutton('options').onChange = function(checked){
        if(checked){
            $("#search_prefix").textbox('disable');
            $("#search_range_end").textbox('disable');
            $('#search_with_prefix').switchbutton('disable');
        }else{
            //$("#search_prefix").textbox('disable');

            if($('#search_with_prefix').switchbutton('options').checked==true){
                $("#search_range_end").textbox('disable')
                $("#search_prefix").textbox('enable');
            }

            $("#search_range_end").textbox('enable')
            $("#search_prefix").textbox('enable');
            $("#search_with_prefix").switchbutton('enable')
        }
    }

    $('#search_with_prefix').switchbutton('options').onChange = function(checked){
        if(checked){
            $("#search_prefix").textbox('enable');
            $("#search_range_end").textbox('disable')
            $('#search_ignore_key').switchbutton('disable');
        }else{
            $("#search_range_end").textbox('enable')
            $('#search_ignore_key').switchbutton('enable');
        }
    }

    let node = $.v3browser.menu.getCurrentTabAttachNode();

    $(function(){
        $("#watchDg").iDatagrid({
            idField: 'id',
            sortOrder1:'asc',
            sortName1:'key',
            pageSize:20,
            frozenColumns:[[
                // {field: 'id', title: '', checkbox: false},
                {field: 'op', title: '操作', sortable: false, halign:'center',align:'center',
                    width: 80, formatter:keyOperateFormatter},
                {field: 'key', title: '事件键', sortable: false,
                    formatter:$.iGrid.buildformatter([$.iGrid.templateformatter('{key}'), $.iGrid.tooltipformatter()]),
                    width: 350},
                {field: 'type', title: '事件类型', sortable: false,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 80},
            ]],
            onBeforeLoad:function (param){
                console.log(param)
                buildResult(param)
            },
            columns: [[
                {field: 'version', title: '版本', sortable: false,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 70},
                {field: 'create_revision', title: '创建修订号', sortable: false,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 100},
                {field: 'mod_revision', title: '更新修订号', sortable: false,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 100},
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

function clearResult(){
    result = []
    $('#watchDg').datagrid('reload')
}


function keyOperateFormatter(value, row, index) {
    let htmlstr = "";

    htmlstr += '<button class="layui-btn-blue layui-btn layui-btn-xs" onclick="viewResult(\'' + index + '\',\''
        + row.id +'\')">查看</button>';
    /*htmlstr += '<button class="layui-btn-gray layui-btn layui-btn-xs" onclick="removeLock(\'' + index + '\',\''
        + row.id +'\')">强制解锁</button>';*/

    return htmlstr;
}

function viewResult(idx){
    let row = $('#watchDg').datagrid('getRows')[idx]
    $.iDialog.openDialog({
        title: '查看事件信息',
        minimizable:false,
        width: 900,
        height: 640,
        href:contextpath + '/watch/view.html',
        render:function(opts, handler){
            let d = this;
            console.log("Open dialog");
            handler.render(row)
        }
    });
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
let xhrObj;

function stopTest() {

    if (watchId == null) {
        $.app.show('没有活动的观察点，请先启动观察点');

        $('#startWatchBtn').linkbutton('enable');
        $('#stopWatchBtn').linkbutton('disable');
        //$('#clearBtn').linkbutton('disable');
        return;
    }
    //
    // let node = $.v3browser.menu.getCurrentTabAttachNode();
    //
    // $.etcd.request.watch.stop(function(response){
    // }, node, watchId);

    if (xhrObj != null) {
        xhrObj.abort();
        xhrObj = null;
    }

    if (watchId != null) {
        //$.app.alert('观察点'+watchId+'已经停止');
    } else {
        //$.app.show('观察点已经停止');
    }

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

        if(param.ignore_key){
            param.prefix = '\0';
            param.range_end = '\0';
        }

        $.etcd.request.watch.watch(function(response, xhr,state){
            console.log(xhr);
            console.log(response);

            if(response.result){

                if(response.result.watch_id!=null){
                    watchId = response.result.watch_id;
                    xhrObj = xhr;
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

                let rowWatchid = response.result.watch_id || '';

                if(response.result.events != null){
                    $.each(response.result.events, function(idx,v){
                        let row = {}
                        if(v.type==null){
                            row.type='PUT'
                        }else{
                            row.type=v.type
                        }

                        row.watch_id = rowWatchid;

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
                            row.create_revision = v.kv.create_revision||'';
                            row.mod_revision = v.kv.mod_revision||'';
                            row.version = v.kv.version||'';
                        }
                        else{
                            row.kv = '';
                            row.id = '';
                            row.key = '';
                            row.create_revision = '';
                            row.mod_revision = '';
                            row.version = '';
                        }

                        row.prev_data=v.prev_kv

                        if(v.prev_kv){
                            if(v.prev_kv.key){
                                v.prev_kv.key = Base64.decode(v.prev_kv.key)
                            }
                            if(v.prev_kv.value){
                                v.prev_kv.value = Base64.decode(v.prev_kv.value)
                            }
                            row.prev_kv = $.extends.json.tostring(v.prev_kv);
                            row.prev_create_revision = v.prev_kv.create_revision||'';
                            row.prev_mod_revision = v.prev_kv.mod_revision||'';
                            row.prev_version = v.prev_kv.version||'';
                        }
                        else{
                            row.prev_kv = '';
                            row.prev_create_revision = '';
                            row.prev_mod_revision = '';
                            row.prev_version = '';
                        }

                        result.splice(0,0, row)
                    })

                    $('#watchDg').datagrid('reload');

                }
            }

        }, node, watchId, param.prefix, param.range_end, param.with_prefix, param.prev_kv, param.fragment,
            param.progress_notify, param.start_revision, function (xhr,status,result) {
                console.log(status)
                console.log(xhr)

                $('#startWatchBtn').linkbutton('enable');
                $('#stopWatchBtn').linkbutton('disable');
                //$('#clearBtn').linkbutton('disable');

                $.app.show('观测点已经停止，并已中断和服务器的连接')

                watchId = null;
            })

    }else{
        $.app.show('填写信息不规范，请检查填写数据内容')
    }
}

function onActivated(opts, title, idx){
    $('#watchDg').datagrid('resize');
}