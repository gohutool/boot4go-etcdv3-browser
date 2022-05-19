

/// For Search
function removeSearch(){
    let row = $.v3browser.menu.getCurrentOpenMenuRow()
    let pid = $('#databaseDg').treegrid('getParent', row.id).id

    $.app.confirm("确定删除查询'"+row.text.jsEncode()+"'", function (){
        let title = $.v3browser.model.title.search(row.data, $.v3browser.model.getLocalNode(row.node_id))
        $.v3browser.menu.closeTab(title);

        $.v3browser.model.removeGroupFromLocal(row.node_id, row.id)
        $('#databaseDg').treegrid('remove', row.id)
        $('#databaseDg').treegrid('refresh', pid);

    })
}

function openSearch() {

}

function addSearch() {
    let node = $.v3browser.menu.getCurrentOpenMenuNode();
    let title = $.v3browser.model.title.newSearch(node)

    $.v3browser.menu.addOneTabAndRefresh(title, './kv/search.html', 'fa fa-navicon', node,
        $.v3browser.model.convert.EmptySearch(node.id));
}

function _openSearch(data) {

}
/// For Search end