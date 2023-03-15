FROM nginx

COPY ./html /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT  ["nginx","-g","daemon off;"]
