function loadLease(){

    let node = $.v3browser.menu.getCurrentTabAttachNode();

    $(function(){
        $("#leaseDg").iDatagrid({
            idField: 'ID',
            sortOrder:'asc',
            sortName:'key',
            pageSize:10,
            frozenColumns:[[
                {field: 'ID', title: '', checkbox: true},
                {field: 'op', title: '操作', sortable: false, halign:'center',align:'center',
                    width: 150, formatter:leaseOperateFormatter},
                {field: '_ID', title: 'LeaseID', sortable: false,
                    formatter:$.iGrid.buildformatter([$.iGrid.templateformatter('{ID}'), $.iGrid.tooltipformatter()]),
                    width: 250},
            ]],
            onBeforeLoad:function (param){
                console.log(param)
                refreshLease(param)
            },
            columns: [[
                {field: 'grantedTTL', title: '租期(秒)', sortable: false,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 120},
                {field: 'TTL', title: '剩余(秒)', sortable: false,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 120},
                {field: 'keys', title: '关联键', sortable: false,
                    formatter:$.iGrid.tooltipformatter(),width: 900}
            ]],
            onLoadSuccess:$.easyui.event.wrap(
                $.fn.iDatagrid.defaults.onLoadSuccess,
                function(data){
                    console.log("@@@@@@@@@@@@@@@@");
                    let dg = this;
                    if(data.rows){
                        $.each(data.rows, function (idx, val) {
                            $.etcd.request.lease.timetolive(function (response) {
                                console.log(response)
                                $(dg).datagrid('updateRow', {
                                    index: idx,
                                    row: {
                                        TTL:response.valid?response.TTL:'已失效',
                                        grantedTTL:response.grantedTTL,
                                        keys: response.keys?response.keys.join(';'):'',
                                    }
                                })
                            }, node, val.ID)
                        });
                    }
                }
            ),
        });
    });
}


function leaseOperateFormatter(value, row, index) {
    let htmlstr = "";
    htmlstr += '<button class="layui-btn-yellowgreen layui-btn layui-btn-xs" onclick="keepaliveLease(\'' + row.ID + '\')">续约</button>';
    htmlstr += '<button class="layui-btn-gray layui-btn layui-btn-xs" onclick="removeLease(\'' + row.ID + '\')">删除租约</button>';

    return htmlstr;
}

function refreshLease(param){

    if(param.rows == null){
        param.rows = 20;
    }

    let skip;

    if(param.page == null || param.page<=0){
        skip = 0
    }else{
        skip = (param.page - 1) * param.rows;
    }

    let node = $.v3browser.menu.getCurrentTabAttachNode();
    $.etcd.request.lease.lease(function (response) {
        $('#leaseDg').datagrid('loadData', {
            total: response.total,
            rows: response.ids
        })
    }, node, skip, param.rows, param.lease_key);
}

function removeLease(leaseId) {
    let node = $.v3browser.menu.getCurrentTabAttachNode();

    if($.extends.isEmpty(leaseId)){
        let rows = $('#leaseDg').datagrid('getChecked');

        if(rows.length == 0){
            $.app.alert('请选择需要删除的租期')
        }else{
            // let done = 0;
            //
            // $.app.showProgress('删除中......')
            //
            // $.each(rows, function (idx, val) {
            //     $.etcd.request.lease.revoke(function (response) {
            //     }, node, leaseId);
            // })
            //
            // while(done<rows.length){
            //
            // }
            //
            // $.app.closeProgess()
            //
            //
            // $.app.show('租期删除成功')


            $.app.confirm('确定要删除选中的租期', function (){

                let leaseIds = $.extends.collect(rows, function(r){
                    return r.ID;
                });

                $.etcd.request.lease.revokeBulk(function (response) {

                    $.app.show('租期删除完成，成功{ok}条，失败{fail}条'.format2(
                        {"ok":response.ok.length+'',
                            "fail":response.fail.length+''})
                    );
                    $('#leaseDg').datagrid('reload');

                }, node, leaseIds);
            });


        }
    }else{

        $.app.confirm('确定要删除租期'+leaseId, function (){
            $.etcd.request.lease.revoke(function (response) {
                $.app.show('租期删除成功')
                $('#leaseDg').datagrid('reload')
            }, node, leaseId);
        });
    }

}

function emptyLease(){
    let node = $.v3browser.menu.getCurrentTabAttachNode();

    $.etcd.request.lease.lease(function (response) {

        let o = response.total;

        if($.extends.number.str2int(o)<=0){
            $.app.info('当前没有租期');
        }else{
            $.app.confirm('重要警告：当前共有'+o+'条租期，确定要清空所有租期，租期过多会花费很久时间', function (){

                let ids = [];

                $.extends.collect(response.ids, function (one){
                    ids.push(one.ID);
                })

                _del(ids, node);
            });
        }



    }, node, 0, 0, null);

}

function _del(ids, node){
    if(ids.length==0){

        $.app.show('租期删除成功')
        $('#leaseDg').datagrid('reload')

        return ;
    }

    let subIds = ids.splice(0, 100)

    $.etcd.request.lease.revokeBulk(function (response) {
        if(ids.length==0){
            $.app.show('租期删除成功')
            $('#leaseDg').datagrid('reload')
            return ;
        }else{
            $.app.show('已经删除100条租期')
        }

        _del(ids, node);

    }, node, subIds);
}

function keepaliveLease(leaseId) {
    let node = $.v3browser.menu.getCurrentTabAttachNode();

    if($.extends.isEmpty(leaseId)){
        let rows = $('#leaseDg').datagrid('getChecked');

        if(rows.length == 0){
            $.app.alert('请选择需要续约的租期')
        }else{
            $.app.confirm('确定要续约选中的租期', function (){

                let leaseIds = $.extends.collect(rows, function(r){
                    return r.ID;
                });

                $.etcd.request.lease.keepAliveBulk(function (response) {

                    $.app.show('租期续约完成，成功{ok}条，失败{fail}条'.format2(
                        {"ok":response.ok.length+'',
                            "fail":response.fail.length+''})
                    );
                    $('#leaseDg').datagrid('reload');

                }, node, leaseIds);
            });


        }
    }else{

        $.app.confirm('确定要续约租期'+leaseId, function (){
            $.etcd.request.lease.keepalive(function (response) {
                $.app.show('租期续约成功')
                $('#leaseDg').datagrid('reload')
            }, node, leaseId);
        });
    }

}

function addLease(){

    $.iDialog.openDialog({
        title: '添加租期',
        minimizable:false,
        width: 750,
        height: 360,
        content: `
            <div style="margin: 10px;">
            </div>
            <div class="cubeui-fluid" id="create-group-form">
                <div class="cubeui-row">
                
                    <div class="cubeui-col-sm11">
                        <label class="cubeui-form-label">系统生成:</label>
                        <div class="cubeui-input-block">
                            <input type="text" checked value='1' id="auto_leaseid"  name="auto"
                                   data-toggle="cubeui-switchbutton" data-options="value:1,width:'50px',onText:'',offText:''">
                        </div>
                    </div>
                </div>
                
                <div class="cubeui-row">
                
                    <div class="cubeui-col-sm11">
                        <label class="cubeui-form-label">租期ID:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textbox" disabled id="lease_id" name="leaseid"
                                   value='' data-options="validType:'number',required:true,prompt:'租期ID, 选择系统自行产生，必须填写'">
                        </div>
                    </div>
                </div>
                
                <div class="cubeui-row">
                
                    <div class="cubeui-col-sm11">
                        <label class="cubeui-form-label">租期(秒):</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-numberspinner" name="ttl"
                                   value='' data-options="required:true,value:60,prompt:'租期时间,默认60秒，必须填写',min:0,increment:60">
                        </div>
                    </div>
                </div>
            </div>
            
        `,
        render:function(opts, handler){
            let d = this;
            console.log("Open dialog");
            handler.render({})

            $("#auto_leaseid").switchbutton('options').onChange = function(checked){
                if(checked){
                    $("#lease_id").numberspinner('disable')
                }else{
                    $("#lease_id").numberspinner('enable')
                }
            }

        },
        buttonsGroup: [{
            text: '保存',
            iconCls: 'fa fa-plus-square-o',
            btnCls: 'cubeui-btn-orange',
            handler:'ajaxForm',
            beforeAjax:function(o){
                let dlg = this;

                let node = $.v3browser.menu.getCurrentTabAttachNode();
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                let info = o.ajaxData;

                $.etcd.request.lease.grant(function (response) {

                    $.app.show('租期添加成功成功，ID='+response.ID+', 租期='+response.TTL+'秒');
                    $.iDialog.closeOutterDialog($(dlg))
                    $('#leaseDg').datagrid('reload')

                }, node, info.leaseid, info.ttl);

                return false;
            }
        }]
    });
}