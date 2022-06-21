package main

import (
	"expvar"
	"fmt"
	"github.com/alecthomas/kingpin"
	"github.com/gohutool/boot4go-etcdv3-browser/db"
	"github.com/gohutool/boot4go-etcdv3-browser/handle"
	. "github.com/gohutool/boot4go-etcdv3-browser/log"
	constants "github.com/gohutool/boot4go-etcdv3-browser/model"
	prometheusfasthttp "github.com/gohutool/boot4go-prometheus/fasthttp"
	util4go "github.com/gohutool/boot4go-util"
	. "github.com/gohutool/boot4go-util/http"
	routing "github.com/qiangxue/fasthttp-routing"
	"github.com/valyala/fasthttp"
	"github.com/valyala/fasthttp/expvarhandler"
	"io/ioutil"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"
)

/**
* golang-sample源代码，版权归锦翰科技（深圳）有限公司所有。
* <p>
* 文件名称 : browser.go
* 文件路径 :
* 作者 : DavidLiu
× Email: david.liu@ginghan.com
*
* 创建日期 : 2022/5/12 20:19
* 修改历史 : 1. [2022/5/12 20:19] 创建文件 by LongYong
*/

const (
	SERVER_VERSION = "etcd4go-browser-v1.0.0"
	SERVER_MAJOR   = 1
	SERVER_MINOR   = 0
	SERVER_BUILD   = 0
)

func main() {
	app := kingpin.New("EtcdV3-Browser", "A Etcd management with UI.")
	addr_flag := app.Flag("addr", "Addr: Etcd management listen addr.").Short('l').Default(":9996").String()
	issuer_flag := app.Flag("issuer", "Issuer: token's issuer.").Short('i').Default(constants.DEFAULT_ISSUER).String()
	expired_flag := app.Flag("token_expire", "Token_expire: many hour(s) token will expire.").Short('e').Default("24").Int()

	li_flag := app.Flag("license", "License: CubeUI License.").Default("").String()

	app.HelpFlag.Short('h')
	app.Version(SERVER_VERSION)

	kingpin.MustParse(app.Parse(os.Args[1:]))

	initLicenseFile(*li_flag)

	db.InitDB()

	l, err := net.Listen("tcp", *addr_flag)
	if err != nil {
		fmt.Println("Start server error " + err.Error())
		return
	}

	if issuer_flag != nil && len(*issuer_flag) > 0 {
		constants.Issuer = *issuer_flag
	}

	if expired_flag != nil && *expired_flag > 0 {
		constants.TokenExpire = time.Duration(*expired_flag) * time.Hour
	}

	if err = initAdmin(); err != nil {
		panic("Init Admin User error " + err.Error())
	}

	Logger.Info("Start " + SERVER_VERSION + " now .... ")

	wg := &sync.WaitGroup{}
	wg.Add(1)
	Logger.Debug("%v %v %v %v", *addr_flag, *issuer_flag, *expired_flag, *li_flag)

	go func(twg *sync.WaitGroup) {
		sig := make(chan os.Signal, 2)
		signal.Notify(sig, syscall.SIGTERM, syscall.SIGINT)
		<-sig
		fmt.Println("signal service close")
		twg.Done()
	}(wg)

	startHttpServer(l)

	wg.Wait()

	l.Close()
	Logger.Info(SERVER_VERSION + " is close")
	time.Sleep(20 * time.Microsecond)
}

func initAdmin() error {
	return nil
}

func initLicenseFile(li string) {
	var txt string
	if util4go.IsEmpty(li) {
		txt = ""
	} else {
		txt = `
				myConfig.li="%v";
			`
		txt = fmt.Sprintf(txt, li)
	}
	err2 := ioutil.WriteFile("./html/static/public/js/cubeui.li.js", []byte(txt), 0666) //写入文件(字节数组)
	if err2 != nil {
		panic("License check error:" + err2.Error())
	}
}

func startHttpServer(listener net.Listener) {

	router := routing.New()

	v3Group := router.Group("/v3/api")

	handle.PrometheusHandler.InitRouter(router, v3Group)
	handle.UserHandler.InitRouter(router, v3Group)

	fs := &fasthttp.FS{
		Root:               "./html",
		IndexNames:         []string{"index.html", "index.hml"},
		GenerateIndexPages: true,
		Compress:           false,
		AcceptByteRange:    false,
		PathNotFound: func(ctx *fasthttp.RequestCtx) {
			ctx.Response.Header.SetContentType("application/json;charset=utf-8")
			ctx.SetStatusCode(fasthttp.StatusNotFound)
			ctx.Write([]byte(Result.Fail(fmt.Sprintf("Page Not Found, %v %v", string(ctx.Method()), string(ctx.RequestURI()))).Json()))
		},
	}

	fsHandler := fs.NewRequestHandler()

	router.Get("/stats", func(ctx *routing.Context) error {
		expvarhandler.ExpvarHandler(ctx.RequestCtx)
		return nil
	})

	router.Any("/*", func(context *routing.Context) error {
		ctx := context.RequestCtx
		fsHandler(ctx)
		UpdateFSCounters(ctx)
		return nil
	})

	requestHandler := func(ctx *fasthttp.RequestCtx) {

		Logger.Debug("%v %v %v %v", string(ctx.Path()), ctx.URI().String(), string(ctx.Method()), ctx.QueryArgs().String())
		defer func() {
			if err := recover(); err != nil {
				Logger.Debug(err)
				// ctx.Error(fmt.Sprintf("%v", err), http.StatusInternalServerError)
				Error(ctx, Result.Fail(fmt.Sprintf("%v", err)).Json(), http.StatusInternalServerError)
			}

			ctx.Response.Header.Set("tick", time.Now().String())
			ctx.Response.Header.SetServer("Gateway-UIManager")

			prometheusfasthttp.RequestCounterHandler(nil)(ctx)

			Logger.Debug("router.HandleRequest is finish")

		}()

		router.HandleRequest(ctx)
	}

	// Start HTTP server.
	Logger.Info("Starting HTTP server on %v", listener.Addr().String())
	go func() {
		if err := fasthttp.Serve(listener, requestHandler); err != nil {
			Logger.Critical("error in ListenAndServe: %v", err)
		}
	}()
}

// Various counters - see https://golang.org/pkg/expvar/ for details.
var (
	// Counter for total number of fs calls
	fsCalls = expvar.NewInt("fsCalls")

	// Counters for various response status codes
	fsOKResponses          = expvar.NewInt("fsOKResponses")
	fsNotModifiedResponses = expvar.NewInt("fsNotModifiedResponses")
	fsNotFoundResponses    = expvar.NewInt("fsNotFoundResponses")
	fsOtherResponses       = expvar.NewInt("fsOtherResponses")

	// Total size in bytes for OK response bodies served.
	fsResponseBodyBytes = expvar.NewInt("fsResponseBodyBytes")
)

func UpdateFSCounters(ctx *fasthttp.RequestCtx) {
	// Increment the number of fsHandler calls.
	fsCalls.Add(1)

	// Update other stats counters
	resp := &ctx.Response
	switch resp.StatusCode() {
	case fasthttp.StatusOK:
		fsOKResponses.Add(1)
		fsResponseBodyBytes.Add(int64(resp.Header.ContentLength()))
	case fasthttp.StatusNotModified:
		fsNotModifiedResponses.Add(1)
	case fasthttp.StatusNotFound:
		fsNotFoundResponses.Add(1)
	default:
		fsOtherResponses.Add(1)
	}
}

func GetUserId(context *routing.Context) string {
	return context.Get("userid").(string)
}

func SetUserId(context *routing.Context, userid string) {
	context.Set("userid", userid)
}
