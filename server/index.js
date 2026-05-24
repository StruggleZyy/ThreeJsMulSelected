//1.引入依赖
const Koa = require('koa')
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser')
const http = require('http')
// 引入路由模块
const { router: authRouter, authMiddleware } = require('./routes/auth')
const { router: menuRouter } = require('./routes/menu')
const { initWebSocket } = require('./wsServer')
const { router: virtualRealRouter } = require('./routes/virtualReal');
//2.创建实例
const app = new Koa()
const server = http.createServer(app.callback())

// ⚠️ 在认证中间件之前初始化 WebSocket
initWebSocket(server)

//3.中间件配置
app.use(cors())
app.use(bodyParser())

//4.挂载路由
app.use(authRouter.routes())
app.use(authRouter.allowedMethods())

// 菜单路由需要认证中间件
app.use(authMiddleware)
app.use(menuRouter.routes())
app.use(menuRouter.allowedMethods())

app.use(virtualRealRouter.routes());
app.use(virtualRealRouter.allowedMethods());
//5.启动服务
server.listen(3000, () => {
    console.log('服务启动成功，端口：3000')
})