function load(){

    let r1 = $($('#layout').layout('panel', 'center'));
    let user = $.v3browser.menu.getCurrentTabAttachData();
    r1.panel('setTitle', user.text+'-用户授权角色');

    $(function(){
        $("#roleDg").iDatagrid({
            idField: 'id',
            pagination: false,
            rownumbers:false,
            frozenColumns:[[
                {
                    field: 'grant',
                    width: 90,halign:'center',align:'center',
                    formatter:$.iGrid.checkedformatter(1, '<span class=\"cube-label cube-label-orange\">已授权</span>', '  ')
                }
            ]],
            columns: [[
                {
                    field: 'name',
                    title: '角色',
                    sortable: true,
                    width: 200,
                    formatter:$.iGrid.click_trigger_formatter('viewRole')
                },
                {
                    field: 'op', title: '操作', sortable: false, halign:'center',align:'center', width: 200,
                    formatter:role_operateFormatter
                },
            ]],
            onBeforeLoad:function (param){
                console.log(param)
                refreshRoles(param);
            },
            onViewRole:function(rowData, index){
              console.log(rowData);
              let p = $('#layout').layout('panel', 'east');

              if(p.isNull()){
                  let east_layout_options = {
                      region:'east',
                      maximized1:true,
                      split:false,border:false,width:'65%',collapsed:true,
                      iconCls:'fa fa-user-o',
                      titleformat:'{0}-角色授权权限', title:'角色授权权限',
                      onCollapse:function(){
                          if(!this.hadcame&&$(this).panel('options').collapsed==true){
                              this.hadcame = true;
                              return ;
                          }

                          if(!$('#layout').layout('isExpand', 'east')){
                              this.hadcame=null;
                              $.easyui.thread.sleep(function () {
                                  $('#layout').layout('remove', 'east');
                              }, 0);
                          }
                      },
                      headerCls:'border_right',bodyCls:'border_right',collapsible:false
                  }

                  $('#layout').layout('add', east_layout_options);

                  let p = $('#layout').layout('panel', 'east');
                  $(p).append($('#footerTpl').html());
                  //$(p).append($('#eastTpl').html());
                  $(p).panel({footer:'#footer'});
                  $.parser.parse('#footer');
                  $(p).panel('resize',{});

                  let cnt = $('#eastTpl').html();
                  p.append(cnt);

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
              }

              let r = $($('#layout').layout('panel', 'east'));
              let t = r.panel('options').titleformat.format(rowData.name);
              r.panel('setTitle', t);

              if (!$('#layout').layout('isExpand', 'east'))
                  $('#layout').layout('expand', 'east');

              let opts = $.iLayout.getLayoutPanelOptions('#layout',  'east');
              if(opts!=null){
                  opts.role = rowData;
              }

              $('#permissionDg').datagrid('reload')

            },
        });
    });
}

function emptyRole(){
    let node = $.v3browser.menu.getCurrentTabAttachNode();
    let user = $.v3browser.menu.getCurrentTabAttachData();

    $.etcd.request.auth.user.get(function(response){
        let rows = response.roles ||[];

        if(rows.length == 0){
            $.app.show('当前没有授权角色。');
            return false;
        }

        $.app.confirm('确定清除当前用户\''+user.text.jsEncode()+'\'所有的授权角色', function (){

            let ok = 0;
            let currentRole = getPermissionLayoutRowData();
            let isClose = false;

            let revokeFn = function (){
                if(rows.length == 0){
                    $.app.show("授权角色清除完成,成功撤销授权角色"+ok+'条');
                    $('#roleDg').datagrid('reload')
                    return ;
                }

                let row = rows.splice(0, 1)[0];

                $.etcd.request.auth.user.revoke(function (response){
                    ok ++;
                    revokeFn()
                }, node, user.text, row.name)
            }

            revokeFn();
        })

    }, node, user.text)
}

function revokeRole(idx){

    let node = $.v3browser.menu.getCurrentTabAttachNode();
    let user = $.v3browser.menu.getCurrentTabAttachData();

    let row = $('#roleDg').datagrid('getRows')[idx];
    // $.app.confirm('确定撤销当前的的授权角色\''+row.name.jsEncode()+'\'', function (){
    //
    // })
    $.etcd.request.auth.user.revoke(function (response){
        $.app.show("授权的角色撤销成功");
        $('#roleDg').datagrid('reload')
    }, node, user.text, row.name)
}

function grantAll(){

    let node = $.v3browser.menu.getCurrentTabAttachNode();
    let user = $.v3browser.menu.getCurrentTabAttachData();

    $.app.confirm('确定授予当前用户\''+user.text.jsEncode()+'\'所有的角色权限', function () {

        $.etcd.request.auth.role.list(function (response) {

            let ok = 0;

            response.roles = response.roles || [];
            let roles = response.roles;

            if (roles.length > 0) {

                let grantFn = function () {
                    if (roles.length == 0) {
                        $.app.show("授权角色授权完成,成功授权角色" + ok + '条');
                        $('#roleDg').datagrid('reload')
                        return;
                    }

                    let row = roles.splice(0, 1)[0];

                    $.etcd.request.auth.user.grant(function (response) {
                        ok++;
                        grantFn()
                    }, node, user.text, row)
                }

                grantFn();
            } else {
                $('#roleDg').datagrid('loadData', {
                    total: 0,
                    rows: [],
                })
            }
        }, node);
    });
}

function grantRole(idx){

    let node = $.v3browser.menu.getCurrentTabAttachNode();
    let user = $.v3browser.menu.getCurrentTabAttachData();

    let row = $('#roleDg').datagrid('getRows')[idx];
    // $.app.confirm('确定撤销当前的的授权角色\''+row.name.jsEncode()+'\'', function (){
    //
    // })
    $.etcd.request.auth.user.grant(function (response){
        $.app.show("角色授权成功");
        $('#roleDg').datagrid('reload')
    }, node, user.text, row.name)
}

function role_operateFormatter(value, row, index) {
    let htmlstr = "";

    htmlstr += '<button class="layui-btn-blue layui-btn layui-btn-xs" onclick="grantRole(\'' + index + '\')">授予权限</button>';
    htmlstr += '<button class="layui-btn-red layui-btn layui-btn-xs" onclick="revokeRole(\'' + index + '\')">撤销权限</button>';

    return htmlstr;
}

function getPermissionLayoutRowData(){
    let p = $.iLayout.getLayoutPanelOptions('#layout',  'east');

    if(p==null){
        return null;
    }else{
        return p.role;
    }
}

function refreshRoles(param){
    let node = $.v3browser.menu.getCurrentTabAttachNode();
    let row = $.v3browser.menu.getCurrentTabAttachData();

    $.etcd.request.auth.role.list(function(response){
        response.roles = response.roles || [];
        let roles = response.roles;

        if(roles.length>0){
            $.etcd.request.auth.user.get(function(response){
                let data = response.roles;

                let hadMap = $.extends.map(data, function(v){
                    return v.name
                })

                data = [];

                $.each(roles, function(idx, v){
                    let one = {};
                    one.name = v;
                    one.id = v;

                    if($.extends.isEmpty(hadMap[v])){
                       one.grant = 0
                    }else{
                        one.grant = 1
                    }

                    data.push(one);
                })

                $('#roleDg').datagrid('loadData', {
                    total: data.length,
                    rows: data
                })
            }, node, row.text)

        }else{
            $('#roleDg').datagrid('loadData', {
                total: 0,
                rows: [],
            })
        }
    }, node);
}

function refreshPermission(param){

    param = param||{}

    let opts = $.iLayout.getLayoutPanelOptions('#layout',  'east');
    if(opts !=null && opts.role != null)
        param.role=opts.role.name;
    else
        param.role = '';

    if($.extends.isEmpty(param.role)){
        return ;
    }

    let node = $.v3browser.menu.getCurrentTabAttachNode();
    $.etcd.request.auth.role.get(function(response){

        let data = null;
        data = pageLocal(response.perm, param, false)

        $.each(data, function(idx, v){
            if(!$.extends.isEmpty(v.range_end)){
                if(v.range_end == $.etcd.request.prefixFormat(v.key)){
                    v.with_prefix = true
                }
            }
            v.id = v.key+'_'+$.extends.isEmpty(v.range_end, '');
        })

        $('#permissionDg').datagrid('loadData', {
            rows: data,
            total: response.count
        })
    }, node, param.role)
}

function closePermPanel(){
    $('#layout').layout('collapse', 'east');
}
