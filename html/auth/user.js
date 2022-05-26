function load(){

    $(function(){
        $("#roleDg").iDatagrid({
            idField: 'id',
            frozenColumns:[[
                {field: 'id', title: '', checkbox: true},
                {field: 'op', title: '操作', sortable: false, halign:'center',align:'center', width: 140,
                    formatter:role_operateFormatter},
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
                      split:false,border:false,width:'75%',collapsed:true,
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
                          {field: 'id', title: '', checkbox: true},
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

            },
            columns: [[
                {
                    field: 'name',
                    title: '角色',
                    sortable: true,
                    width: '280',
                    formatter:$.iGrid.click_trigger_formatter('viewRole')
                }
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

function refreshRoles(param){
    let node = $.v3browser.menu.getCurrentTabAttachNode();
    let row = $.v3browser.menu.getCurrentTabAttachData();

    $.etcd.request.auth.user.get(function(response){
        let data = response.roles;

        $.each(data, function(idx, v){
            v.id = v.name;
        })

        $('#roleDg').datagrid('loadData', {
            total: response.count,
            rows: data
        })
    }, node, row.text)
}

function refreshPermission(param){
    if(param.username){
        console.log(param)
    }
}