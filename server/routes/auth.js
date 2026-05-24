// server/routes/auth.js - 用户认证相关路由
const Router = require('koa-router')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const router = new Router()
const SECRET_KEY = 'your-secret-key'

// 模拟用户数据库（实际项目中应该用真实数据库）
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 密码：password
    nickname: '系统管理员',
    avatar: '/avatars/admin.jpg',
    department: '技术部',
    position: '系统管理员',
    roles: ['admin'],
    permissions: ['user:create', 'user:delete', 'user:read', 'user:update', 'role:read', 'menu:read']
  },
  {
    id: 2,
    username: 'user',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 密码：password
    nickname: '普通用户',
    avatar: '/avatars/user.jpg',
    department: '运营部',
    position: '操作员',
    roles: ['user'],
    permissions: ['read']
  }
]

// JWT认证中间件
const authMiddleware = async (ctx, next) => {

  // 📌 添加白名单  如果在白名单中：无论是否登录都能正常访问
  const whiteList = [
    '/api/virtual-real/measure-points/config',  // 新增的测点配置接口
    '/api/virtual-real/selected-measure-points'   // 原有的测点选择接口
  ];
  
  // 如果在白名单中，跳过验证
  if (whiteList.includes(ctx.path)) {
    await next();
    return;
  }
  // 📌 添加白名单
  const token = ctx.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    ctx.status = 401
    ctx.body = { code: 401, message: '未登录' }
    return
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    ctx.state.user = decoded
    await next()
  } catch (error) {
    ctx.status = 401
    ctx.body = { code: 401, message: 'token无效' }
  }
}

// 2.登录接口 后端接收请求
router.post('/api/auth/login', async (ctx) => {
  const { username, password } = ctx.request.body

  if (!username || !password) {
    ctx.body = { code: 400, message: '用户名和密码不能为空' }
    return
  }

  // 3.查找用户
  const user = users.find(u => u.username === username)
  if (!user) {
    ctx.body = { code: 400, message: '用户不存在' }
    return
  }

  // 4.验证密码
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    ctx.body = { code: 400, message: '密码错误' }
    return
  }

  // 5.生成 JWT token
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions
    },
    SECRET_KEY,
    { expiresIn: '24h' }
  )

  // 返回用户信息和token
  ctx.body = {
    code: 200,
    message: '登录成功',
    data: {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        department: user.department,
        position: user.position
      },
      token: token,
      roles: user.roles,
      permissions: user.permissions
    }
  }
})

// 获取用户信息接口
router.get('/api/auth/info', authMiddleware, (ctx) => {
  const user = users.find(u => u.id === ctx.state.user.id)
  if (!user) {
    ctx.status = 404
    ctx.body = { code: 404, message: '用户不存在' }
    return
  }

  ctx.body = {
    code: 200,
    data: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      department: user.department,
      position: user.position,
      roles: user.roles,
      permissions: user.permissions
    }
  }
})
// 验证 token 有效性
router.get('/api/auth/validate',  authMiddleware,async (ctx) => {
  // 假设你的认证中间件已经将用户信息放入 ctx.state.user
  if (ctx.state.user) {
    ctx.body = {
      code: 200,
      message: 'token 有效',
      data: ctx.state.user
    };
  } else {
    ctx.status = 401;
    ctx.body = {
      code: 401,
      message: 'token 无效或已过期'
    };
  }
});
module.exports = {
  router,
  authMiddleware,
  users
}