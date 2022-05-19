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

    if(list==null)
        return rtn;

    $.each(list, function (idx,v){
        if(id == v.id){
            rtn = idx;
            return false;
        }
    })

    return rtn;
}

function exchangeOrder(list, id1, id2){
    let idx1 = findIdx(list, id1);

    let idx2 = 0;

    if(id2){
        idx2 = findIdx(list, id2)
    }

    let one = list[idx1];
    let two = list[idx2];

    list[idx1] = two;
    list[idx2] = one;
}

function exchangeBefore(sid, list, tid) {
    let idx1 = findIdx(list, sid);
    let one = list[idx1];
    list.splice(idx1, 1)

    let idx2 = 0;
    if(tid){
        idx2 = findIdx(list, tid)
    }
    list.splice(idx2, 0, one)
}

function exchangeAfter(sid, list, tid) {
    let idx1 = findIdx(list, sid);
    let one = list[idx1];
    list.splice(idx1, 1)

    let idx2 = list.length;
    if(tid){
        idx2 = findIdx(list, tid);
    }
    list.splice(idx2+1, 0, one)
}