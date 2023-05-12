<template>
  <div id="app">
    <div id="nav">
      <el-menu
        :default-active="activeIndex"
        class="el-menu-demo"
        mode="horizontal"
        :router="true"
      >
        <el-menu-item index="/">单个节点</el-menu-item>
        <el-menu-item index="/two">两个节点</el-menu-item>
        <el-menu-item index="/more">多节点</el-menu-item>
      </el-menu>
    </div>
    <router-view />
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeIndex: '/',
    };
  },
};
</script>

