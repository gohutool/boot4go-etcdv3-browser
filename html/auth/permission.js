let isSearch = false

function loadPermission(){
    $(function(){
        $("#permissionDg").iDatagrid({
            idField: 'id',
            frozenColumns:[[
                {field: 'id', title: '', checkbox: true},
                {field: 'op', title: '操作', sortable: false, halign:'center',align:'center', width: 140,
                    formatter:role_operateFormatter},
                {field: 'key', title: '键', sortable: true,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 400},
                {field: 'range_end', title: '键尾', sortable: true,
                    formatter:$.iGrid.buildformatter([function (value, rowData, rowIndex) {
                        if(rowData.with_prefix){
                            return '前缀模式';
                        }else{
                            return value;
                        }
                    },$.iGrid.tooltipformatter()]),
                    width: 200},
            ]],
            onBeforeLoad:function (param){
                console.log(param)
                refreshPermission(param);
            },
            columns: [[
                {
                    field: 'permType',
                    title: '权限',
                    sortable: true,
                    width: 440,
                    formatter:$.iGrid.tooltipformatter()
                },
            ]],
        });


        $("#permissionDg").iDatagrid({
            idField: 'id',
            frozenColumns:[[
                {field: 'id', title: '', checkbox: true},
                {field: 'op', title: '操作', sortable: false, halign:'center',align:'center', width: 140,
                    formatter:role_operateFormatter},
                {field: 'key', title: '键', sortable: true,
                    formatter:$.iGrid.tooltipformatter(),
                    width: 400},
                {field: 'range_end', title: '键尾', sortable: true,
                    formatter:$.iGrid.buildformatter([function (value, rowData, rowIndex) {
                        if(rowData.with_prefix){
                            return '前缀模式';
                        }else{
                            return value;
                        }
                    },$.iGrid.tooltipformatter()]),
                    width: 200},
            ]],
            onBeforeLoad:function (param){
                console.log(param)
                refreshPermission(param);
            },
            columns: [[
                {
                    field: 'permType',
                    title: '权限',
                    sortable: true,
                    width: 440,
                    formatter:$.iGrid.tooltipformatter()
                },
            ]],
        });
    });
}

function role_operateFormatter(value, row, index) {
    let htmlstr = "";

    htmlstr += '<button class="layui-btn-blue layui-btn layui-btn-normal layui-btn-xs" onclick="editPermission(\'' + index + '\')">修改</button>';
    htmlstr += '<button class="layui-btn-gray layui-btn layui-btn-xs" onclick="revokePermission(\'' + index + '\')">撤销</button>';

    return htmlstr;
}

function refreshPermission(param){
    let node = $.v3browser.menu.getCurrentTabAttachNode();
    let row = $.v3browser.menu.getCurrentTabAttachData();

    $.etcd.request.auth.role.get(function(response){
        let data = pageLocal(response.perm, param, false)

        $.each(data, function(idx, v){
            v.id = v.key+'_'+$.extends.isEmpty(v.range_end, '');
            if(!$.extends.isEmpty(v.range_end)){
                if(v.range_end == $.etcd.request.prefixFormat(v.key)){
                    v.with_prefix = true
                }
            }
        })

        $('#permissionDg').datagrid('loadData', {
            total: response.count,
            rows: data
        })
    }, node, row.text)
}


function revokePermission(idx){

    let node = $.v3browser.menu.getCurrentTabAttachNode();
    let role = $.v3browser.menu.getCurrentTabAttachData();

    if($.extends.isEmpty(idx)){
        let rows = $('#permissionDg').datagrid('getChecked');

        if(rows.length == 0){
            $.app.show('请选择需要撤销的权限');
            return false;
        }

        $.app.confirm('确定撤销当前选择的权限', function (){

            let ok = 0;
            let revokeFn = function (){

                if(rows.length == 0){
                    $.app.show("权限撤销完成,成功撤销权限"+ok+'条');
                    $('#permissionDg').datagrid('reload')
                    return ;
                }

                let row = rows.splice(0, 1)[0];
                console.log(row)

                $.etcd.request.auth.role.revoke(function (response){
                    ok ++;
                    revokeFn()
                }, node, role.text, row.key,  row.range_end)
            }

            revokeFn();
        })

    }else{
        let row = $('#permissionDg').datagrid('getRows')[idx];
        $.app.confirm('确定撤销当前的权限\''+row.key.jsEncode()+'\'', function (){
            $.etcd.request.auth.role.revoke(function (response){
                $.app.show("权限撤销成功");
                $('#permissionDg').datagrid('reload')
            }, node, role.text, row.key,  row.range_end)
        })
    }
}

function emptyPermission(){

    let node = $.v3browser.menu.getCurrentTabAttachNode();
    let role = $.v3browser.menu.getCurrentTabAttachData();

    $.etcd.request.auth.role.get(function(response){
        let rows = response.perm ||[];

        $.each(rows, function(idx, v){
            v.id = v.key+'__'+$.extends.isEmpty(v.range_end, '');

            if(!$.extends.isEmpty(v.range_end)){
                if(v.range_end == $.etcd.request.prefixFormat(v.key)){
                    v.with_prefix = true
                }
            }
        })

        if(rows.length == 0){
            $.app.show('当前没有授权的权限。');
            return false;
        }

        $.app.confirm('确定清除当前角色\''+role.text.jsEncode()+'\'所有的权限', function (){

            let ok = 0;

            let revokeFn = function (){
                if(rows.length == 0){
                    $.app.show("权限清除完成,成功撤销权限"+ok+'条');
                    $('#permissionDg').datagrid('reload')
                    return ;
                }

                let row = rows.splice(0, 1)[0];

                $.etcd.request.auth.role.revoke(function (response){
                    ok ++;
                    revokeFn()
                }, node, role.text, row.key,  row.range_end)
            }

            revokeFn();
        })

    }, node, role.text)
}

function grantPermission() {
    _permissionDlg();
}

function editPermission(idx) {
    let row = $('#permissionDg').datagrid('getRows')[idx];
    _permissionDlg(row);
}

function _permissionDlg(data){

    data = data ||{}

    $.iDialog.openDialog({
        text: '添加权限',
        minimizable:false,
        width: 600,
        height: 360,
        content: `
            <div style="margin: 10px;">
            </div>
            <div class="cubeui-fluid" id="create-group-form">
                <div class="cubeui-row">
                
                        <label class="cubeui-form-label">键:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textbox" name="key" 
                                   value='{{:key}}' data-options="required:true,prompt:'键，必须填写'">
                        </div>
                    
                </div>        
                
                <div class="cubeui-row">
                        <label class="cubeui-form-label">前缀模式:</label>
                        <input data-toggle="cubeui-switchbutton" id='permission_with_prefix' name="with_prefix"
                               data-options="value:1,width:'50px',onText:'',offText:''">
                </div>           
                
                <div class="cubeui-row">
                        <label class="cubeui-form-label">键尾:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textbox" id="permission_range_end" name="range_end" 
                                   value='{{:range_end}}' data-options="required:false,prompt:'键尾，选择填写'">
                        </div>
                </div>           
                
                <div class="cubeui-row">
                
                        <label class="cubeui-form-label">权限:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-combobox" name="permType" 
                                   value='{{:permType}}'  data-options="
                                   required:true,prompt:'权限，必须填写',                                   
                                   valueField:'text',
                                   textField:'text',
                                   data:[{text:'READWRITE'},{text:'READ'},{text:'WRITE'}]
                                   ">
                        </div>                    
                </div>                 
        `,
        render:function(opts, handler){
            console.log("Open dialog");

            let row = $.v3browser.menu.getCurrentOpenMenuRow();
            handler.render(data)

            $('#permission_with_prefix').switchbutton('options').onChange = function(checked){
                if(checked){
                    $("#permission_range_end").textbox('disable')
                }else{
                    $("#permission_range_end").textbox('enable')
                }
            }

            if(data.with_prefix){
                $('#permission_with_prefix').switchbutton('check')
                $('#permission_range_end').textbox('setText','')
                $('#permission_range_end').textbox('setValue','')
            }

            $(this).dialog('setTitle', '授予权限')
        },
        buttonsGroup:[{
            text: '确定',
            iconCls: 'fa fa-plus',
            btnCls: 'cubeui-btn-blue',
            handler:'ajaxForm',
            beforeAjax:function(o){
                let t = this;
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                let info = o.ajaxData

                let role = $.v3browser.menu.getCurrentTabAttachData();
                let node = $.v3browser.menu.getCurrentTabAttachNode();

                if(info.with_prefix){
                    info.range_end = $.etcd.request.prefixFormat(info.key);
                }else{
                    info.range_end = '';
                }

                $.etcd.request.auth.role.grant(function(response){
                    $.app.show('权限授予成功')
                    $.iDialog.closeOutterDialog($(t))
                    $('#permissionDg').datagrid('reload')
                }, node, role.text, info.key, info.range_end, info.permType);

                return false
            },
        }]
    });
}