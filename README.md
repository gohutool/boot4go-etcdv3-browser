# boot4go-etcdv3-browser
A client of etcd with v3 api to browse and maintain the data and resource of etcd.

![license](https://img.shields.io/badge/license-Apache--2.0-green.svg)

# what's new?
1. 删除了go部分,请配合nginx启动该项目
2. 配合nginx转发解决访问etcd跨域问题，合并解决办公网环境无法直接访问机房问题

## Installation and Getting Started

### From hub.docker.com
- pull image from hub
  - docker image pull joinsunsoft/etcdv3-browser:0.9.0
- start container with image, and publish 80/443 port to your port
  - docker container run --rm -p 9980:80 --name etcdv3-browser joinsunsoft/etcdv3-browser:0.9.0

## Visit the browser tool
- You must add the host-mapping for the etcdv3-browser to be '****.joinsunsoft.com'
  - for example: 
    - My etcdv3-browser is install the machine which ip is 192.168.56.101
    - Add '192.168.56.101    etcdv3-broswer.joinsunsoft.com' to c:/windows/system32/drivers/etc/hosts file  
- Now, you can visit http://etcdv3-broswer.joinsunsoft.com:9980.
- Default Username/Password ginghan/123456
- Enjoy it now.