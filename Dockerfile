FROM golang:1.18.0-alpine
ADD . /app
WORKDIR /app
ENV GO111MODULE=on
ENV GOPROXY="https://goproxy.cn,direct"
RUN go mod tidy
RUN go mod download
RUN go build -o server .

EXPOSE 9996

ENTRYPOINT  ["./server"]
