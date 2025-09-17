import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('./views/Projects.vue') },
  // 新增：项目详情路由
  { path: '/projects/:id', component: () => import('./views/ProjectDetail.vue') },
  // 新增：项目编辑路由
  { path: '/projects/:id/edit', component: () => import('./views/EditProject.vue') },
]

const router = createRouter({ history: createWebHistory(), routes })

createApp(App).use(createPinia()).use(ElementPlus).use(router).mount('#app')
