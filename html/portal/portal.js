function renderPage(){
    console.log("finish")

    $.app.get(V3_API_URL + '/portal/piereport', null, function (data) {
        //$("#pathDg").datagrid("loadData", data.data.list);

        APP.renderBody("#tmpl1", data.data)
    });

}

function refreshPieChart(){

    /*$.app.get(V3_API_URL + '/portal/piereport', null, function (data) {
        //$("#pathDg").datagrid("loadData", data.data.list);
        $('#pathCount').text(data.data.pathCount)
        $('#serverCount').text(data.data.serverCount)
        $('#nodeVisit').text(data.data.nodeVisit)
        $('#certCount').text(data.data.certCount)
        $('#domainCount').text(data.data.domainCount)
        $('#clusterCount').text(data.data.clusterCount)
        $('#endpointCount').text(data.data.endpointCount)
        $('#useCertCount').text(data.data.certTotal)
        // APP.renderBody("#tmpl1", data.data)

        _refreshPieChart(data.data)

        refresh3HoursLineChart()

        refresh24HoursBarChart()

    });*/
}

function refresh24HoursBarChart(){

    $.app.get(V3_API_URL + '/portal/barreport', null, function (data) {

        $("#barChart").charts({
            option: {
                "title": {
                    "text": "24小时请求量和失败量",
                    "top": "bottom",
                    "subtext": "24小时请求量和失败量",
                    "x": "center"
                },
                "tooltip": {
                    "trigger": "axis"
                },
                "legend": {
                    "left": "right",
                    "data": [
                        "网关请求次数",
                        "请求失败次数"
                    ]
                },
                "calculable": true,
                "xAxis": {
                    "type": "category",
                    "boundaryGap": false,
                    "data": data.data.xAxis,
                },
                "yAxis": {
                    "type": "value",
                    "axisLabel": {
                        "formatter": "{value} 次"
                    }
                },
            },
            height: 400
        });

        let min = 0,max = 0,minIdx = 0, maxIdx = 0;

        $.each(data.data.increase_lose, function (idx, v){
            if(v < min){
                min = v;
                minIdx = idx;
            }
            if(v > max){
                max = v;
                maxIdx = idx;
            }
        })

        $('#barChart').charts('setSeries', [
            {
                "name": "网关请求次数",
                "type": "bar",
                "data": data.data.increase_ok,
                "markPoint": {
                    "data": [
                        {
                            "type": "max",
                            "name": "最大值"
                        },
                        {
                            "type": "min",
                            "name": "最小值"
                        }
                    ]
                },
                "markLine": {
                    "data": [
                        {
                            "type": "average",
                            "name": "平均值"
                        }
                    ]
                }
            },
            {
                "name": "请求失败次数",
                "type": "bar",
                "data": data.data.increase_lose,
                "markPoint": {
                    "data": [
                        {
                            "name": "最高",
                            "value": max,
                            "xAxis": maxIdx,
                            "yAxis": max
                        },
                        {
                            "name": "最低",
                            "value": min,
                            "xAxis": minIdx,
                            "yAxis": min
                        }
                    ]
                },
                "markLine": {
                    "data": [
                        {
                            "type": "average",
                            "name": "平均值"
                        }
                    ]
                }
            }
        ]);
    })
}

function refresh3HoursLineChart(){

    $.app.get(V3_API_URL + '/portal/linereport', null, function (data) {

        $("#lineChart").charts({
            option:{
                "title": {
                    "text": "最近6小时请求变化",
                    "top": "bottom",
                    "subtext": "最近6小时请求变化",
                },
                "tooltip": {
                    "trigger": "axis"
                },
                "legend": {
                    "left": "right",
                    "data": [
                        "网关请求次数",
                        "请求失败次数",
                        "黑名单次数"
                    ]
                },
                "xAxis": {
                    "type": "category",
                    "boundaryGap": false,
                    "data": data.data.xAxis,
                },
                "yAxis": {
                    "type": "value",
                    "axisLabel": {
                        "formatter": "{value} 次"
                    }
                },
            },
            height:400
        })

        $('#lineChart').charts('setSeries', [
            {
                "name": "网关请求次数",
                "type": "line",
                connectNulls:true,
                "data": data.data.current_ok,
                "markPoint": {
                    "data": [
                        {
                            "type": "max",
                            "name": "最大值"
                        },
                        {
                            "type": "min",
                            "name": "最小值"
                        }
                    ]
                },
                "markLine": {
                    "data": [
                        {
                            "type": "average",
                            "name": "平均值"
                        }
                    ]
                }
            },
            {
                "name": "请求失败次数",
                connectNulls:true,
                "type": "line",
                "data": data.data.current_lose,
                "markPoint": {
                    "data": [
                        {
                            "type": "max",
                            "name": "最大错误数"
                        },
                        {
                            "type": "min",
                            "name": "最小错误数"
                        }
                    ]
                },
                "markLine": {
                    "data": [
                        {
                            "type": "average",
                            "name": "平均值"
                        },
                        [
                            {
                                "symbol": "none",
                                "x": "90%",
                                "yAxis": "max"
                            },
                            {
                                "symbol": "circle",
                                "label": {
                                    "normal": {
                                        "position": "start",
                                        "formatter": "最大值"
                                    }
                                },
                                "type": "max",
                                "name": "最高点"
                            }
                        ]
                    ]
                }
            },
            {
                "name": "黑名单次数",
                connectNulls:true,
                "type": "line",
                "data": data.data.current_blackip,
                "markPoint": {
                    "data": [
                        {
                            "type": "max",
                            "name": "最大数"
                        },
                        {
                            "type": "min",
                            "name": "最小数"
                        }
                    ]
                }
            }
        ]);
    });

}

function _refreshPieChart(data){
    $("#pieChart").charts({
        option:{
            "title": {
                "text": "网关请求状态统计",
                "top": "top",
                "top": "bottom",
                "subtext": "网关请求状态统计",
                "x": "center"
            },
            "tooltip": {
                "trigger": "item",
                "formatter": "{a} {b} : {c} ({d}%)"
            },
            "legend": {
                "orient": "vertical",
                "left": "left",
            }
        },
        onBeforeRender: function (chart, options, option){
            console.log("Come in")
            return option
        },
        height:400
    })

    $('#pieChart').charts('setSeries', [
        {
            "name": "网关请求",
            type: 'pie',
            radius: [0, '30%'],
            "data": [
                {
                    "value": data.visitMetrics.lose,
                    "name": "转发丢失"
                },
                {
                    "value": data.visitMetrics.ok,
                    "name": "转发成功"
                }
            ],
            "itemStyle": {
                "emphasis": {
                    "shadowBlur": 10,
                    "shadowOffsetX": 0,
                    "shadowColor": "rgba(0, 0, 0, 0.5)"
                }
            }
        },
        {
            "name": "网关请求状态",
            type: 'pie',
            radius: ['35%', '50%'],
            label: {
                formatter: '{b|{b}：} {per|{d}%}  ',
                backgroundColor: '#F6F8FC',
                borderColor: '#8C8D8E',
                borderWidth: 1,
                borderRadius: 4,
                padding:[0, 0, 0, 10],
                rich: {
                    a: {
                        color: '#6E7079',
                        lineHeight1: 22,
                        align: 'center'
                    },
                    hr: {
                        borderColor: '#8C8D8E',
                        width: '100%',
                        borderWidth: 1,
                        height: 0
                    },
                    b: {
                        color: '#4C5058',
                        fontSize: 12,
                        fontWeight: 'bold',
                        lineHeight: 28
                    },
                    per: {
                        color: '#fff',
                        backgroundColor: '#4C5058',
                        padding: [3, 4, 3, 10],
                        borderRadius: 4
                    }
                }
            },
            "data": [
                {
                    "value": data.visitMetrics.host_lose,
                    "name": "无效域名"
                },
                {
                    "value": data.visitMetrics.target_lose,
                    "name": "无效目标"
                },
                {
                    "value": data.visitMetrics.blackip_lose,
                    "name": "黑名单访问"
                },
                {
                    "value": data.visitMetrics.path_lose,
                    "name": "无效路径"
                },
                {
                    "value": data.visitMetrics.error_lose,
                    "name": "目标响应错误"
                },
                {
                    "value": data.visitMetrics.ok,
                    "name": "请求成功"
                }
            ],
            "itemStyle": {
                "emphasis": {
                    "shadowBlur": 10,
                    "shadowOffsetX": 0,
                    "shadowColor": "rgba(0, 0, 0, 0.5)"
                }
            }
        }
    ])
}