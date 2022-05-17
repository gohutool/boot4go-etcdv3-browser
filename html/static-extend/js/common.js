function isTokenOK(){
    let token = $.app.localStorage.getToken();
    console.log("Token: " + token)

    if ($.extends.isEmpty(token)){
        return false;
    }else{
        return true;
    }
}

function copyArray(list){
    let rtn = [];

    $.each(list, function (idx,v){
        rtn.push($.extend({}, v))
    })

    return rtn;
}

function findIdx(list, id){
    let rtn = -1;
    $.each(list, function (idx,v){
        if(id == v.id){
            rtn = idx;
            return false;
        }
    })

    return rtn;
}
