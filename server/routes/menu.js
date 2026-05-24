// server/routes/menu.js - 菜单路由相关
const Router = require("koa-router");

const router = new Router();

// 完整的菜单数据
const allMenus = [
  {
    key: "首页",
    icon: "🏠",
    children: [
      { name: "首页", path: "/", meta: { title: "首页", requiresAuth: false } },
    ],
  },
  {
    key: "航天器",
    icon: "🚀",
    children: [
      {
        name: "运载火箭",
        path: "/space/rocket",
        meta: {
          title: "运载火箭",
          requiresAuth: true,
          roles: ["user", "admin"],
        },
      },
      {
        name: "载人飞船",
        path: "/space/spaceship",
        meta: {
          title: "载人飞船",
          requiresAuth: true,
          roles: ["user", "admin"],
        },
      },
      // { name: '空间站', path: '/space/station', meta: { title: '空间站', requiresAuth: true, roles: ['user', 'admin'] } },
      // { name: '卫星', path: '/space/satellite', meta: { title: '卫星', requiresAuth: true, roles: ['user', 'admin'] } },
      // { name: '探测器', path: '/space/probe', meta: { title: '深空探测器', requiresAuth: true, roles: ['user', 'admin'] } }
    ],
  },
  {
    key: "发射任务",
    icon: "🛸",
    children: [
      {
        name: "部件爆炸",
        path: "/mission/PartExplosion",
        meta: {
          title: "部件爆炸",
          requiresAuth: true,
          roles: ["user", "admin"],
        },
      },
      {
        name: "发射记录",
        path: "/mission/record",
        meta: {
          title: "发射记录",
          requiresAuth: true,
          roles: ["user", "admin"],
        },
      },
      {
        name: "部件框选",
        path: "/mission/partSelected",
        meta: {
          title: "部件框选",
          requiresAuth: true,
          roles: ["user", "admin"],
        },
      },
      {
        name: "测点设计",
        path: "/mission/TestSceneSetup",
        meta: {
          title: "测点设计",
          requiresAuth: true,
          roles: ["user", "admin"],
        },
      },
      {
        name: "厂房设计",
        path: "/mission/scenceBuild",
        meta: {
          title: "厂房设计",
          requiresAuth: true,
          roles: ["user", "admin"],
        },
      },
    ],
  },
  {
    key: "测控通信",
    icon: "📡",
    children: [
      {
        name: "地面测控",
        path: "/tracking/ground",
        meta: {
          title: "地面测控",
          requiresAuth: true,
          roles: ["user", "admin"],
        },
      },
      {
        name: "航天测控网",
        path: "/tracking/network",
        meta: {
          title: "航天测控网",
          requiresAuth: true,
          roles: ["user", "admin"],
        },
      },
      // { name: '数据传输', path: '/tracking/data', meta: { title: '数据传输', requiresAuth: true, roles: ['user', 'admin'] } },
      // { name: '深空通信', path: '/tracking/deepspace', meta: { title: '深空通信', requiresAuth: true, roles: ['user', 'admin'] } }
    ],
  },
  {
    key: "航天员",
    icon: "👨‍🚀",
    children: [
      {
        name: "试验员",
        path: "/astronaut/list",
        meta: { title: "试验员", requiresAuth: true, roles: ["user", "admin"] },
      },
      // { name: '训练计划', path: '/astronaut/training', meta: { title: '训练计划', requiresAuth: true, roles: ['user', 'admin'] } },
      // { name: '出舱活动', path: '/astronaut/eva', meta: { title: '出舱活动', requiresAuth: true, roles: ['user', 'admin'] } },
      // { name: '生活保障', path: '/astronaut/life', meta: { title: '生活保障', requiresAuth: true, roles: ['user', 'admin'] } }
    ],
  },
  {
    key: "科学实验",
    icon: "🔬",
    children: [
      {
        name: "微重力实验",
        path: "/experiment/gravity",
        meta: {
          title: "微重力实验",
          requiresAuth: true,
          roles: ["user", "admin"],
        },
      },
      {
        name: "组件选择",
        path: "/experiment/chartSelect",
        meta: {
          title: "组件选择",
          requiresAuth: true,
          roles: ["user", "admin"],
        },
      },
      // { name: '材料科学', path: '/experiment/material', meta: { title: '材料科学', requiresAuth: true, roles: ['user', 'admin'] } },
      // { name: '天文观测', path: '/experiment/astronomy', meta: { title: '天文观测', requiresAuth: true, roles: ['user', 'admin'] } }
    ],
  },
  {
    key: "系统管理",
    icon: "⚙️",
    children: [
      {
        name: "用户管理",
        path: "/system/user",
        meta: { title: "用户管理", requiresAuth: true, roles: ["admin"] },
      },
      {
        name: "角色管理",
        path: "/system/role",
        meta: { title: "角色管理", requiresAuth: true, roles: ["admin"] },
      },
      {
        name: "菜单管理",
        path: "/system/menu",
        meta: { title: "菜单管理", requiresAuth: true, roles: ["admin"] },
      },
      // { name: '权限管理', path: '/system/permission', meta: { title: '权限管理', requiresAuth: true, roles: ['admin'] } },
      {
        name: "岗位管理",
        path: "/system/position",
        meta: { title: "岗位管理", requiresAuth: true, roles: ["admin"] },
      },
    ],
  },
];

// 根据用户权限动态返回菜单
router.get("/api/menu/list", async (ctx) => {
  // 从认证中间件获取用户信息
  const userRoles = ctx.state.user?.roles || [];

  // 过滤菜单：根据用户角色
  const filteredMenus = allMenus
    .map((group) => {
      const filteredChildren = group.children.filter((child) => {
        const meta = child.meta;
        // 不需要认证的菜单
        if (!meta.requiresAuth) return true;
        // 需要认证但没有角色的菜单
        if (!meta.roles) return false;
        // 检查用户是否有权限访问
        return meta.roles.some((role) => userRoles.includes(role));
      });

      // 如果分组下有子菜单，则保留分组
      return filteredChildren.length > 0
        ? {
            ...group,
            children: filteredChildren,
          }
        : null;
    })
    .filter(Boolean);

  ctx.body = {
    code: 200,
    message: "success",
    data: filteredMenus,
  };
});

module.exports = {
  router,
  allMenus,
};
