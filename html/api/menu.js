let CURRENT_OPEN_MENU_ROW = null;

$.v3browser = $.extend({}, $.v3browser);

$.v3browser.menu = {
    openMenu : function(e, row){
        CURRENT_OPEN_MENU_ROW = row;

        if(row.mm){
            let dbRow = $('#nodemm').menu('options').node;

            if($.isFunction(row.mm)){
                let mm = row.mm.call(row, dbRow, $('#databaseDg'));
                if(mm){
                    $(mm).menu('show', {
                        left: e.pageX,
                        top: e.pageY
                    });
                }
            }else{
                $('#'+row.mm).menu('show', {
                    left: e.pageX,
                    top: e.pageY
                });
            }

            return ;
        }

        switch (row.type){
            case "kv":
                break
            case "lease":
                break
            case "lock":
                break
            case "user":
                break
            case "role":
                break
            case "alarm":
                break
            case "cluster":
                break
            case "db":
                if(row.open){
                    $.v3browser.menu.openOpenMenu(e, row)
                }else{
                    $.v3browser.menu.openCloseMenu(e, row)
                }
                break
            default:
                break
        }
    },
    createEtcdMenu:function (e, row){
        $('#createEtcMm').menu('show', {
            left: e.pageX,
            top: e.pageY
        });
    },
    openOpenMenu : function (e, row){

        $('#nodemm').menu('options').node = row;
        let m = $('#nodemm').menu('getItem',  $('#menuitem01')[0]);

        $('#nodemm').menu('setText', {
            target: m.target,
            text: "关闭连接"
        });
        $('#nodemm').menu('setIcon', {
            target: $('#menuitem01')[0],
            iconCls: "fa fa-undo"
        });

        $('#nodemm').menu('show', {
            left: e.pageX,
            top: e.pageY
        });
    },
    openCloseMenu:function (e, row){
        $('#nodemm').menu('options').node = row;
        let m = $('#nodemm').menu('getItem',  $('#menuitem01')[0]);

        $('#nodemm').menu('setText', {
            target: m.target,
            text: "打开连接"
        });

        $('#nodemm').menu('setIcon', {
            target: m.target,
            iconCls: "fa fa-folder-open-o"
        });

        $('#nodemm').menu('show', {
            left: e.pageX,
            top: e.pageY
        });
    },
    getCurrentOpenMenuRow: function () {
        return CURRENT_OPEN_MENU_ROW;
    },
    getCurrentOpenMenuNodeId: function() {
        let row = CURRENT_OPEN_MENU_ROW;

        if(row.type=='db')
            return row.id;

        return row.node_id;
    },
    getCurrentOpenMenuNode: function() {
        let dbId = $.v3browser.menu.getCurrentOpenMenuNodeId();

        let idx = $.v3browser.model.findLocalNode(dbId)
        if(idx<0)
            return null;

        return CONFIG.nodes[idx];
    },
    addOneTabAndRefresh:function (title, src, iconCls, etcdNode, data) {
        let iframe = '<iframe src="' + src + '" frameborder="0" style="border:0;width:100%;height:100%;"></iframe>';
        let t = parent.$('#index_tabs');

        if(t.tabs('exists', title)){
            t.tabs('close', title);
        }

        t.tabs("add", {
            title: title,
            iframe:true,
            content: iframe,
            closable: true,
            attachNode: etcdNode,
            attachData: data,
            iconCls: iconCls||'fa fa-th',
            border: true
        });

        //let ct = t.tabs('getTab', title);
        //ct.attachNode = etcdNode;
        //ct.attachData=data;

    },
    getCurrentTab:function (){
        let t = parent.$('#index_tabs');
        let tab = t.tabs('getSelected');
        return tab;
    },
    _getCurrentTabOptions:function (){
        let tab = $.v3browser.menu.getCurrentTab();
        return $(tab).panel('options');
    },
    getCurrentTabOptions:function (){
        return parent.window.$.v3browser.menu._getCurrentTabOptions();
    },
    getCurrentTabAttachNode:function (){
        // let tab = $.v3browser.menu.getCurrentTab();
        // return tab.attachNode;
        let options = $.v3browser.menu.getCurrentTabOptions();
        return options.attachNode;
    },
    getCurrentTabAttachData:function (){
        // let tab = $.v3browser.menu.getCurrentTab();
        // return tab.attachData;
        let options = $.v3browser.menu.getCurrentTabOptions();
        return options.attachData;
    },
    closeTab:function(title){
        let t = parent.$('#index_tabs');
        t.tabs('close', title);
    },
    isTabExist:function(title){
        let t = parent.$('#index_tabs');
        return t.tabs('exists', title)
    },
    _refreshTab:function(title){
        let t = parent.$('#index_tabs');
        let tab = t.tabs('getTab', title);

        if(tab!=null){
            t.tabs('select', title);
            $(tab).panel('refresh');
            return true;
        }else{
            return false;
        }
    },
    refreshTab:function(title){
        return parent.window.$.v3browser.menu._refreshTab(title);
    },
    closeTabs:function(nodeRow){
        let name = nodeRow.text;

        let t = parent.$('#index_tabs');
        let tabs = t.tabs('tabs');

        let removed = [];

        $.each(tabs, function(idx, v){
            let title = $(v).panel('options').title
            if(title.indexOf('@'+name)>=0){
                removed.push(title)
            }
        })

        $.each(removed, function(idx, v){
            t.tabs('close', v)
        });

    }
}
