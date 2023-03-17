function renderPage(){
    console.log("finish")

    $.app.get(V3_API_URL + '/portal/piereport', null, function (data) {
        //$("#pathDg").datagrid("loadData", data.data.list);

        APP.renderBody("#tmpl1", data.data)
    });

}

function refreshPieChart(){

    $.app.getJson('//www.ginghan.com/info.json', null, function(data){
        $('#nodeCount').text(data.data.nodeCount);
        $('#nodeVisit').text(data.data.nodeVisit);
        $('#manCount').text(data.data.manCount);
        $('#newManCount').text(data.data.newManCount);
        $('#userCount').text(data.data.userCount);
        $('#newUserCount').text(data.data.newUserCount);
        $('#certCount').text(data.data.certCount);
        $('#useCertCount').text(data.data.useCertCount);
    });
}
