

/// For Cluster
function refreshMembers(row){
    let node=null;
    let dbId=null;

    if(row == null){
        node = $.v3browser.menu.getCurrentOpenMenuNode();
        dbId = node.id;
    }else{
        node = $.v3browser.model.getLocalNode(row.node_id);
        dbId = node.id;
    }

    let memberRowId = dbId + '_7';

    $.etcd.request.maintenance.status(function (res) {

        let leader = res.leader;

        $.etcd.request.cluster.member_list(function (response) {

            if($.etcd.response.check(response)){
                $.app.show('刷新集群成功，集群节点个数为' + response.members.length);

                let datas = [];
                $.each(response.members, function (idx, member) {
                    let one = $.v3browser.model.convert.Member2Data(member, dbId)
                    one.data = member

                    if(member.ID == leader){
                        one.iconCls = 'fa fa-grav';
                    }

                    datas.push(one)
                })

                removeSubTree(memberRowId);
                $('#databaseDg').treegrid('append', {
                    parent:memberRowId,
                    data: datas
                });

                $('#databaseDg').treegrid('refresh', memberRowId);
                $('#databaseDg').treegrid('expand', memberRowId);

            }else{

            }
        }, node)
    }, node)

}

/// For Cluster end
function addMemberDg(){

    $.iDialog.openDialog({
        text: '添加服务成员',
        minimizable:false,
        width: 600,
        height: 240,
        content: `
            <div style="margin: 10px;">
            </div>
            <div class="cubeui-fluid" id="create-group-form">
                <div class="cubeui-row">
                
                        <label class="cubeui-form-label">作为学习者:</label>
                        <div class="cubeui-input-block">
                            <input data-toggle="cubeui-switchbutton" id='search_with_prefix' name="isLearner"
                                   data-options="value:1,width:'50px',onText:'',offText:''">
                        </div>
                    
                </div>   
                <div class="cubeui-row">
                
                        <label class="cubeui-form-label">连接节点:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textbox" name="peerURLs" 
                                   value='' data-options="required:true,prompt:'连接节点，必须填写，例如: http://192.168.56.101:2380'">
                        </div>
                    
                </div>                   
        `,
        render:function(opts, handler){
            console.log("Open dialog");

            let row = $.v3browser.menu.getCurrentOpenMenuRow();
            handler.render({})

            $(this).dialog('setTitle', '添加服务成员')
        },
        buttonsGroup:[{
            text: '添加',
            iconCls: 'fa fa-sitemap',
            btnCls: 'cubeui-btn-blue',
            handler:'ajaxForm',
            beforeAjax:function(o){
                let t = this;
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                let info = o.ajaxData
                let node = $.v3browser.menu.getCurrentOpenMenuNode();

                $.app.confirm('确定添加服务成员到服务集群', function () {
                    $.etcd.request.cluster.member_add(function(response){
                        $.app.show('服务成员添加成功')
                        $.iDialog.closeOutterDialog($(t))
                        refreshMembers();
                    }, node, info.peerURLs, info.isLearner);
                })

                return false
            },
        }]
    });
}

function removeMember(){
    let row = $.v3browser.menu.getCurrentOpenMenuRow();

    $.app.confirm('确定从服务集群移除服务成员\''+row.text.jsEncode()+'\'', function () {
        let node = $.v3browser.menu.getCurrentOpenMenuNode();

        $.etcd.request.cluster.member_remove(function(response){
            $.app.show('从集群移除服务成员成功')
            refreshMembers();
        }, node, row.data.ID);
    })
}

function promoteMember(){
    let row = $.v3browser.menu.getCurrentOpenMenuRow();

    $.app.confirm('确定从学习者提升服务成员成为投票者\''+row.text.jsEncode()+'\'', function () {
        let node = $.v3browser.menu.getCurrentOpenMenuNode();

        $.etcd.request.cluster.member_promote(function(response){
            $.app.show('提升服务成员成为投票者成功')
            refreshMembers();
        }, node, row.data.ID);
    })
}

function transferMember(){
    let row = $.v3browser.menu.getCurrentOpenMenuRow();

    $.app.confirm('确定交接服务成员成为领导者\''+row.text.jsEncode()+'\'', function () {
        let node = $.v3browser.menu.getCurrentOpenMenuNode();

        $.etcd.request.maintenance.transfer(function(response){
            $.app.show('服务成员成为领导者交接成功')
            refreshMembers();
        }, node, row.data.ID);
    })
}

function updateMember(){

    let row = $.v3browser.menu.getCurrentOpenMenuRow();

    $.iDialog.openDialog({
        text: '更新节点信息',
        minimizable:false,
        width: 700,
        height: 340,
        content: `
            <div style="margin: 10px;">
            </div>
            <div class="cubeui-fluid" id="create-group-form">
                <div class="cubeui-row">
                
                        <label class="cubeui-form-label">节点名称:</label>
                        <div class="cubeui-input-block">
                            <input type="text" readonly data-toggle="cubeui-textbox" name="name" 
                                   value='{{:name}}' data-options="">
                        </div>
                    
                </div>   
                <div class="cubeui-row">
                
                        <label class="cubeui-form-label">节点ID:</label>
                        <div class="cubeui-input-block">
                            <input type="text" readonly data-toggle="cubeui-textbox" name="ID" 
                                   value='{{:ID}}' data-options="">
                        </div>
                </div>   
                
                <div class="cubeui-row">
                
                        <label class="cubeui-form-label">节点通信地址:</label>
                        <div class="cubeui-input-block">
                            <input type="text" data-toggle="cubeui-textbox" name="peerURLs" 
                                   value='{{:peerURLs}}' data-options="required:true,prompt:'连接节点通信地址，必须填写，例如: http://192.168.56.101:2380'">
                        </div>
                    
                </div>                   
        `,
        render:function(opts, handler){
            console.log("Open dialog");

            let row = $.v3browser.menu.getCurrentOpenMenuRow();
            let data = $.extend({}, row.data)

            if($.extends.isEmpty(data.name)){
                data.name = '未知'
            }
            data.peerURLs = data.peerURLs.join(',')

            handler.render(data)

            $(this).dialog('setTitle', '更新节点信息')
        },
        buttonsGroup:[{
            text: '更新',
            iconCls: 'fa fa-save',
            btnCls: 'cubeui-btn-blue',
            handler:'ajaxForm',
            beforeAjax:function(o){
                let t = this;
                o.ajaxData = $.extends.json.param2json(o.ajaxData);
                let info = o.ajaxData
                let node = $.v3browser.menu.getCurrentOpenMenuNode();

                $.app.confirm('确定更新成员信息', function () {
                    $.etcd.request.cluster.member_update(function(response){
                        $.app.show('服务成员信息更新成功')
                        $.iDialog.closeOutterDialog($(t))
                        refreshMembers();
                    }, node, row.data.ID, info.peerURLs);
                })

                return false
            },
        }]
    });
}

function showClusterStatus(){
    let node1 = $.v3browser.menu.getCurrentOpenMenuNode();

    $.etcd.request.maintenance.status(function (response) {

        $.etcd.request.cluster.member_list(function(ms){

            response.members = ms.members||[]||[];

            $.iDialog.openDialog({
                title: '查看服务器信息',
                minimizable:false,
                width: 900,
                height: 700,
                href:contextpath + '/cluster/status.html',
                render:function(opts, handler){
                    let d = this;
                    console.log("Open dialog");
                    handler.render(response)
                },
                buttonsGroup: [{
                    text: '刷新',
                    iconCls: 'fa fa-refresh',
                    btnCls: 'cubeui-btn-orange',
                    handler:'ajaxForm',
                    beforeAjax:function(o){

                        return false
                    }
                }]

            });

        }, node1);


    }, node1)
}