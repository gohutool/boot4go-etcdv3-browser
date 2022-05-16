let V3_API_ROOT = '{host}'

let V3_MTN_URL = API_ROOT + '/v3/maintenance/status'
let V3_ECHO_URL = API_ROOT + '/v3/kv/range'
let V3_RANGE_URL = API_ROOT + '/v3/kv/range'
let V3_AUTH_URL = API_ROOT + '/v3/auth/authenticate'
let V3_VERSION_URL = API_ROOT + '/version'

String.prototype.Format = function(args) {
    let result = this;

    result = result.replace(/\{(.+?)\}/g, function(word, key){
        if(args&&args[key])
            return args[key];
        else
            return '';
    });

    return result;
}

EtcdV3 = {
    Client:function(endpoint){
        let serverInfo = {'host':endpoint}

        return {
            getRange : function(data){
                let request = {};
                request.url = V3_RANGE_URL.Format(serverInfo);
                request.method = 'post';
                let param = $.extend({}, data);
                request.param = data;
            }
        }
    },
    response:{

    }
}

