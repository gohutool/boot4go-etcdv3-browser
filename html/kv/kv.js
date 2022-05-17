function load(){
    $(function(){
        $("#groupDg").iDatagrid({
            idField: 'key',
            sortOrder:'asc',
            sortName:'key',
            frozenColumns:[[
                {field: 'key', title: '', checkbox: true},
                {field: 'op', title: '操作', sortable: false, width: 80, formatter:operateFormatter},
                {field: 'id', title: '键', sortable: true,
                    formatter:$.iGrid.templateformatter('{key}'),
                    width: 400},
            ]],
            onSortColumn:function (sort, order) {
                console.log(sort + '<>' + order);
            },
            columns: [[
                {
                    field: 'value',
                    title: '键值',
                    sortable: false,
                    width: 540,
                    formatter:$.iGrid.tooltipformatter()
                },
                {
                    field: 'version',
                    title: '版本',
                    sortable: false,
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
    var htmlstr = "";

    htmlstr += '<button class="cubeui-btn-gray layui-btn layui-btn-xs" onclick="delKey(\'' + row.id + '\')">删除</button>';

    return htmlstr;
}

function queryKv(prefix, sort, order, start, count){

}

function openEditDiag() {
    let node = $.v3browser.menu.getCurrentTabAttachNode();
    console.log(node)
}