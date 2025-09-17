<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const project = ref<{ id: string; name: string; type: string; status: string; createdAt: string } | null>(null)

function formatTime(iso?: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const title = computed(() => (project.value ? `项目：${project.value.name}` : '项目详情'))

async function fetchDetail() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    const { data } = await axios.get(`/api/projects/${id}`)
    project.value = data
  } catch (e: any) {
    ElMessage.error(e?.message || '加载详情失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/')
}

// 新增：跳转编辑页
function goEdit() {
  const id = project.value?.id || (route.params.id as string)
  if (id) router.push(`/projects/${id}/edit`)
}

onMounted(fetchDetail)
</script>

<template>
  <div style="padding: 24px">
    <el-page-header @back="goBack" content="详情页">
      <template #breadcrumb>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">项目列表</el-breadcrumb-item>
          <el-breadcrumb-item>详情</el-breadcrumb-item>
        </el-breadcrumb>
      </template>
    </el-page-header>

    <div style="margin-top: 16px">
      <h2>{{ title }}</h2>
      <el-card v-loading="loading" shadow="never" style="max-width: 720px">
        <template #header>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span>基本信息</span>
            <div style="display:flex; gap:8px; align-items:center">
              <el-button size="small" type="primary" @click="goEdit">编辑</el-button>
              <el-button size="small" @click="goBack">返回列表</el-button>
            </div>
          </div>
        </template>
        <div v-if="project">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="名称">{{ project.name }}</el-descriptions-item>
            <el-descriptions-item label="类型">{{ project.type }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ project.status }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(project.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="ID" :span="2">{{ project.id }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-else style="color:#999">暂无数据</div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
</style>