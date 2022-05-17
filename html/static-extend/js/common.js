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