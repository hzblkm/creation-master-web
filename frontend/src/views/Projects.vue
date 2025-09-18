<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

type Project = { id: string; name: string; type: string; status: string; createdAt: string }

const loading = ref(false)
const projects = ref<Project[]>([])
const loadError = ref<string | null>(null)
const skeletonCount = ref(6)
const VIEW_MODE_KEY = 'projects_view_mode'

const viewMode = ref<'table' | 'card'>('card')
const form = ref<{ name: string; type: string }>({ name: '', type: 'novel' })
const rowLoading = ref<Record<string, boolean>>({})

// 新增：搜索与分页（客户端）
const search = ref('')
const currentPage = ref(1)
const pageSize = ref(8)

const filteredProjects = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return projects.value
  return projects.value.filter((p) => {
    const name = (p.name || '').toLowerCase()
    const type = (p.type || '').toLowerCase()
    const status = (p.status || '').toLowerCase()
    return name.includes(q) || type.includes(q) || status.includes(q)
  })
})

const sortedProjects = computed(() => {
  return [...filteredProjects.value].sort((a, b) => {
    const at = new Date(a.createdAt || 0).getTime()
    const bt = new Date(b.createdAt || 0).getTime()
    if (bt !== at) return bt - at
    return (a.name || '').localeCompare(b.name || '')
  })
})

const total = computed(() => sortedProjects.value.length)

const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedProjects.value.slice(start, start + pageSize.value)
})

watch([search, projects], () => {
  // 搜索或后端刷新后回到第 1 页
  currentPage.value = 1
})

watch(total, (t) => {
  // 当总数变少时，确保当前页不越界
  const maxPage = Math.max(1, Math.ceil(t / pageSize.value))
  if (currentPage.value > maxPage) currentPage.value = maxPage
})

function onPageChange(p: number) {
  currentPage.value = p
}

function onSizeChange(s: number) {
  pageSize.value = s
  currentPage.value = 1
}

function formatTime(iso?: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso as string
  }
}

function isNameValid() {
  const v = (form.value.name ?? '').trim()
  return v.length >= 2 && v.length <= 64
}

async function createProject() {
  // 防重复提交
  if (loading.value) return

  const trimmed = (form.value.name ?? '').trim()
  if (!trimmed) {
    ElMessage.error('请输入项目名称')
    return
  }
  if (trimmed.length < 2) {
    ElMessage.error('名称至少 2 个字符')
    return
  }
  if (trimmed.length > 64) {
    ElMessage.error('名称不超过 64 个字符')
    return
  }
  try {
    loading.value = true
    const payload = { name: trimmed, type: form.value.type, status: 'draft' }
    await axios.post('/api/projects', payload)
    form.value.name = ''
    await fetchProjects()
    ElMessage.success('创建成功')
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  } finally {
    loading.value = false
  }
}

function goDetail(p: Project) {
  if (!p?.id) return
  router.push(`/projects/${p.id}`)
}

function navigateToDetail(p: Project) {
  goDetail(p)
}

function goEdit(p: Project) {
  if (!p?.id) return
  router.push(`/projects/${p.id}/edit`)
}

async function removeProject(p: Project) {
  if (!p?.id) return
  try {
    await ElMessageBox.confirm(`确定删除项目「${p.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    rowLoading.value[p.id] = true
    await axios.delete(`/api/projects/${p.id}`)
    projects.value = projects.value.filter((x) => x.id !== p.id)
    ElMessage.success('已删除')
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  } finally {
    rowLoading.value[p.id] = false
  }
}

function calcSkeletonCount() {
  const w = window.innerWidth
  let cols = 1
  if (w >= 1200) cols = 4
  else if (w >= 992) cols = 3
  else if (w >= 768) cols = 2
  else cols = 1
  skeletonCount.value = cols * 2
}

async function fetchProjects() {
  loadError.value = null
  loading.value = true
  try {
    const { data } = await axios.get('/api/projects')
    projects.value = data
  } catch (e: any) {
    loadError.value = e?.message || '加载失败'
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function refreshProjects() {
  fetchProjects()
}

onMounted(() => {
  // 恢复视图模式
  const saved = localStorage.getItem(VIEW_MODE_KEY)
  if (saved === 'table' || saved === 'card') {
    viewMode.value = saved as 'table' | 'card'
  }
  // 初始骨架计算与监听
  calcSkeletonCount()
  window.addEventListener('resize', calcSkeletonCount)
  // 首次加载
  fetchProjects()
})

onUnmounted(() => {
  window.removeEventListener('resize', calcSkeletonCount)
})

watch(viewMode, (v) => {
  localStorage.setItem(VIEW_MODE_KEY, v)
})
</script>

<template>
  <div style="padding: 24px">
    <h2>项目列表</h2>
    <div style="margin-bottom: 16px; display: flex; gap: 8px; align-items: center; justify-content: space-between; flex-wrap: wrap">
      <div style="display:flex; gap:8px; align-items:center">
        <el-input v-model="form.name" placeholder="项目名称" style="width: 240px" @keyup.enter="createProject" maxlength="64" show-word-limit />
        <el-select v-model="form.type" placeholder="类型" style="width: 160px">
          <el-option label="小说" value="novel" />
          <el-option label="剧本" value="script" />
        </el-select>
        <el-button type="primary" :loading="loading" :disabled="loading || !isNameValid()" @click="createProject">新建项目</el-button>
      </div>
      <div style="display:flex; gap:8px; align-items:center">
        <el-input v-model="search" placeholder="搜索项目" clearable style="width: 260px" />
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="table">表格视图</el-radio-button>
          <el-radio-button label="card">卡片视图</el-radio-button>
        </el-radio-group>
        <el-button size="small" :loading="loading" @click="refreshProjects">刷新</el-button>
      </div>
    </div>

    <!-- 错误态 -->
    <div v-if="loadError" style="margin-bottom: 12px">
      <el-result icon="error" title="加载失败" :sub-title="loadError">
        <template #extra>
          <el-button type="primary" :loading="loading" @click="refreshProjects">重试</el-button>
        </template>
      </el-result>
    </div>

    <!-- 卡片视图 -->
    <div v-if="viewMode === 'card'">
      <div v-if="loading && !projects.length" class="card-grid">
        <el-card v-for="i in skeletonCount" :key="`s-${i}`" shadow="never">
          <el-skeleton animated :rows="4"/>
        </el-card>
      </div>
      <div v-else-if="!loading && projects.length === 0 && !loadError">
        <el-empty description="暂无项目">
          <div style="display:flex; gap:8px; justify-content:center">
            <el-button type="primary" @click="createProject" :disabled="loading || !isNameValid()">新建项目</el-button>
            <el-button @click="refreshProjects" :disabled="loading">刷新</el-button>
          </div>
        </el-empty>
      </div>
      <div v-else class="card-grid">
        <el-card v-for="p in pagedProjects" :key="p.id" shadow="hover">
          <template #header>
            <div class="clickable" style="display:flex;justify-content:space-between;align-items:center" @click="goDetail(p)">
              <span style="font-weight:600">{{ p.name }}</span>
              <el-tag type="info" size="small">{{ p.type }}</el-tag>
            </div>
          </template>
          <div class="clickable" @click="goDetail(p)">
            <div style="margin-bottom:8px">
              <span style="color:#999">状态：</span>
              <el-tag :type="p.status==='active' ? 'success' : 'warning'" size="small">{{ p.status }}</el-tag>
            </div>
            <div style="color:#999">创建：{{ formatTime(p.createdAt) }}</div>
          </div>
          <!-- 操作按钮区，阻止冒泡避免触发卡片点击跳转 -->
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
            <el-button size="small" @click.stop="goDetail(p)">查看</el-button>
            <el-button size="small" type="success" @click.stop="navigateToDetail(p)">进入</el-button>
            <el-button size="small" type="primary" @click.stop="goEdit(p)">编辑</el-button>
            <el-button size="small" type="danger" :loading="rowLoading[p.id] === true" :disabled="rowLoading[p.id] === true || loading" @click.stop="removeProject(p)">删除</el-button>
          </div>
        </el-card>
      </div>
      <div v-if="total > 0" style="display:flex;justify-content:center;margin-top:16px">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[8,12,16,24,32]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>

    <!-- 表格视图 -->
    <div v-else>
      <el-table v-if="projects.length > 0" :data="pagedProjects" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="status" label="状态" />
        <el-table-column prop="createdAt" label="创建时间">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="320">
          <template #default="{ row }">
            <el-button size="small" @click="goDetail(row)">查看</el-button>
            <el-button type="primary" size="small" @click="goEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" :loading="rowLoading[row.id] === true" :disabled="rowLoading[row.id] === true || loading" @click="removeProject(row)">删除</el-button>
            <el-button type="success" size="small" :disabled="loading" @click="navigateToDetail(row)">进入</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-else-if="loading && !loadError" class="table-skeleton">
        <el-skeleton :rows="5" animated />
      </div>
      <div v-else-if="!loading && !loadError">
        <el-empty description="暂无项目">
          <div style="display:flex; gap:8px; justify-content:center">
            <el-button type="primary" @click="createProject" :disabled="loading || !isNameValid()">新建项目</el-button>
            <el-button @click="refreshProjects" :disabled="loading">刷新</el-button>
          </div>
        </el-empty>
      </div>
      <div v-if="total > 0" style="display:flex;justify-content:center;margin-top:16px">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[8,12,16,24,32]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.table-skeleton { padding: 16px; }
.clickable { cursor: pointer; }
</style>