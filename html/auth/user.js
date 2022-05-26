function load(){

    $(function(){
        $("#roleDg").iDatagrid({
            idField: 'id',
            frozenColumns:[[
                {field: 'id', title: '', checkbox: true},
            ]],
            onBeforeLoad:function (param){
                console.log(param)
                //refreshPermission(param);
            },
            columns: [[
                {
                    field: 'permType',
                    title: '角色',
                    sortable: true,
                    width: '280',
                    formatter:$.iGrid.tooltipformatter()
                },
                {field: 'op', title: '操作', sortable: false, halign:'center',align:'center', width: 140,
                    formatter:role_operateFormatter},
            ]],
        });


        $("#permissionDg").iDatagrid({
            idField: 'id',
            frozenColumns:[[
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
                //refreshPermission(param);
            },
            columns: [[
                {
                    field: 'permType',
                    title: '权限',
                    sortable: true,
                    width: 120,
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
