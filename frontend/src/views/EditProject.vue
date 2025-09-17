<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, FormInstance, FormRules } from 'element-plus'

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

const rules: FormRules<ProjectForm> = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, message: '名称至少 2 个字符', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

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
  } catch (e: any) {
    ElMessage.error(e?.message || '加载编辑数据失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  const id = route.params.id as string
  // 返回详情页
  if (id) router.push(`/projects/${id}`)
  else router.push('/')
}

async function submit(formEl?: FormInstance) {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    const id = route.params.id as string
    try {
      await axios.patch(`/api/projects/${id}` , { ...form.value })
      ElMessage.success('保存成功')
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
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="96px" v-loading="loading">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" maxlength="64" show-word-limit />
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
          <el-button @click="goBack">取消</el-button>
          <el-button type="primary" :loading="saving" @click="submit(formRef)">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
</style>