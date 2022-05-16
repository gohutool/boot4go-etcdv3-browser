package handle

import (
	"github.com/gohutool/boot4go-etcdv3-browser/db"
	. "github.com/gohutool/boot4go-etcdv3-browser/log"
	. "github.com/gohutool/boot4go-etcdv3-browser/model"
	. "github.com/gohutool/boot4go-util"
	. "github.com/gohutool/boot4go-util/http"
	. "github.com/gohutool/boot4go-util/jwt"
	routing "github.com/qiangxue/fasthttp-routing"
)

/**
* golang-sample源代码，版权归锦翰科技（深圳）有限公司所有。
* <p>
* 文件名称 : user.go
* 文件路径 :
* 作者 : DavidLiu
× Email: david.liu@ginghan.com
*
* 创建日期 : 2022/5/13 15:15
* 修改历史 : 1. [2022/5/13 15:15] 创建文件 by LongYong
*/
type userHandler struct {
}

var UserHandler = &userHandler{}

func (u *userHandler) InitRouter(router *routing.Router, routerGroup *routing.RouteGroup) {
	router.Post("/login", u.Login)
	router.Get("/logout", u.Logout)
}

func (u *userHandler) Login(context *routing.Context) error {
	username := GetParams(context.RequestCtx, "username", "")
	password := GetParams(context.RequestCtx, "password", "")

	if username == "" || password == "" {
		Result.Fail("请填写登录用户名和用户密码").Response(context.RequestCtx)
		return nil
	}

	username = MD5(username)

	user := db.GetUser(username)

	if user == nil {
		Result.Fail("登录用户名和用户密码不正确").Response(context.RequestCtx)
		return nil
	}

	if user.UserPassword != SaltMd5(password, user.UserID) {
		Result.Fail("登录用户名和用户密码不正确").Response(context.RequestCtx)
		return nil
	}

	token := GenToken(user.UserID, Issuer, Issuer, TokenExpire)

	Result.Success(token, "OK").Response(context.RequestCtx)

	Logger.Debug("%v %v %v", user.UserID, username, password)

	return nil

}

func (u *userHandler) Logout(context *routing.Context) error {
	Logger.Debug("%v", "Logout")
	Result.Success("", "OK").Response(context.RequestCtx)
	return nil
}
