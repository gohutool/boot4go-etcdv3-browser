FROM nginx

COPY ./html /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf

ENTRYPOINT   ["/bin/bash","-c","echo resolver $(cat /etc/resolv.conf |grep -i \"^nameserver\"|cut -d \" \" -f2 |xargs)\" ipv6=off;\">/etc/nginx/resolver.conf && nginx -g 'daemon off;'"]
