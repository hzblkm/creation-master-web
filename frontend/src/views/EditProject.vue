<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)

interface ProjectForm {
  name: string
  type: string
  status: string
}

const formRef = ref<FormInstance>()
const form = ref<ProjectForm>({ name: '', type: 'novel', status: 'draft' })
const originalForm = ref<ProjectForm | null>(null)

const allowedTypes = ['novel', 'script'] as const
const allowedStatus = ['draft', 'active'] as const

// 自定义校验器
const validateName = (_rule: any, value: string, callback: (err?: Error) => void) => {
  const v = (value ?? '').trim()
  if (!v) return callback(new Error('请输入项目名称'))
  if (v.length < 2) return callback(new Error('名称至少 2 个字符'))
  if (v.length > 64) return callback(new Error('名称不超过 64 个字符'))
  return callback()
}
const validateType = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (!value) return callback(new Error('请选择类型'))
  if (!allowedTypes.includes(value as any)) return callback(new Error('类型不合法'))
  return callback()
}
const validateStatus = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (!value) return callback(new Error('请选择状态'))
  if (!allowedStatus.includes(value as any)) return callback(new Error('状态不合法'))
  return callback()
}

const rules: FormRules<ProjectForm> = {
  name: [
    { validator: validateName, trigger: ['blur', 'change'] },
  ],
  type: [{ validator: validateType, trigger: 'change' }],
  status: [{ validator: validateStatus, trigger: 'change' }],
}

const isDirty = computed(() => {
  if (!originalForm.value) return false
  const a = form.value
  const b = originalForm.value
  return a.name.trim() !== b.name.trim() || a.type !== b.type || a.status !== b.status
})

async function fetchDetail() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    const { data } = await axios.get(`/api/projects/${id}`)
    form.value = {
      name: data.name,
      type: data.type,
      status: data.status || 'draft'
    }
    originalForm.value = { ...form.value }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载编辑数据失败')
  } finally {
    loading.value = false
  }
}

async function confirmLeaveIfDirty() {
  if (saving.value || !isDirty.value) return true
  try {
    await ElMessageBox.confirm('存在未保存的更改，确定要离开吗？', '提示', {
      type: 'warning',
      confirmButtonText: '离开',
      cancelButtonText: '取消',
    })
    return true
  } catch {
    return false
  }
}

function goBack() {
  // 返回详情页（含未保存保护）
  confirmLeaveIfDirty().then((ok) => {
    if (!ok) return
    const id = route.params.id as string
    if (id) router.push(`/projects/${id}`)
    else router.push('/')
  })
}

onBeforeRouteLeave(async () => {
  const ok = await confirmLeaveIfDirty()
  return ok
})

async function submit(formEl?: FormInstance) {
  if (!formEl || saving.value || loading.value) return
  await formEl.validate(async (valid) => {
    if (!valid) return
    if (!isDirty.value) {
      ElMessage.info('未修改，无需保存')
      return
    }
    saving.value = true
    const id = route.params.id as string
    try {
      const payload: ProjectForm = {
        name: form.value.name.trim(),
        type: form.value.type,
        status: form.value.status,
      }
      await axios.patch(`/api/projects/${id}` , { ...payload })
      ElMessage.success('保存成功')
      originalForm.value = { ...payload }
      router.push(`/projects/${id}`)
    } catch (e: any) {
      ElMessage.error(e?.message || '保存失败')
    } finally {
      saving.value = false
    }
  })
}

onMounted(fetchDetail)
</script>

<template>
  <div style="padding: 24px">
    <el-page-header @back="goBack" content="编辑项目">
      <template #breadcrumb>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">项目列表</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: `/projects/${$route.params.id}` }">详情</el-breadcrumb-item>
          <el-breadcrumb-item>编辑</el-breadcrumb-item>
        </el-breadcrumb>
      </template>
    </el-page-header>

    <el-card shadow="never" style="max-width: 720px; margin-top: 16px" :body-style="{ padding: '20px 24px' }">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>基本信息</span>
          <el-button @click="goBack" :disabled="saving">返回</el-button>
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="96px" v-loading="loading">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" maxlength="64" show-word-limit @keyup.enter="submit(formRef)" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 200px">
            <el-option label="小说" value="novel" />
            <el-option label="剧本" value="script" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 200px">
            <el-option label="草稿" value="draft" />
            <el-option label="进行中" value="active" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button @click="goBack" :disabled="saving">取消</el-button>
          <el-button type="primary" :loading="saving" :disabled="!isDirty || loading || saving" @click="submit(formRef)">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
</style>