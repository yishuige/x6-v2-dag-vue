<template>
  <div>
    <el-alert
      title="温馨提示"
      type="success"
      description="单个演示，不涉及链接，仅就描绘单个节点的场景"
    >
    </el-alert>
    <div id="oneNode"></div>
  </div>
</template>

<script>
import { Graph } from '@antv/x6';
import { register } from '@antv/x6-vue-shape';
import DagNode from '@/components/dag/Index';
import dagMap from '@/components/dag/dagMap.json';

export default {
  data() {
    return {
      // 节点状态列表
      nodeStatusList: [
        {
          id: 'node-0',
          status: 'success',
        },
        {
          id: 'node-1',
          status: 'success',
        },
        {
          id: 'node-2',
          status: 'success',
        },
        {
          id: 'node-3',
          status: 'success',
        },
        {
          id: 'node-4',
          status: 'error',
          statusMsg: '错误信息示例',
        },
      ],
    };
  },

  mounted() {
    // 1. 注册节点
    register({
      shape: 'data-processing-dag-node',
      width: 212,
      height: 48,
      component: DagNode,
    });

    // 2. 创建画布
    const graph = new Graph({
      container: document.getElementById('oneNode'),
      width: 1000,
      height: 1000,
    });

    // 3. 根据json数据创建节点，此处只取第一个
    let map = {};
    map.nodes = dagMap.nodes.slice(0, 1);
    graph.fromJSON(map);

    // 4. 设置节点状态
    let { id, status, statusMsg } = this.nodeStatusList[0];
    let node = graph.getCellById(id);
    let data = node.getData();
    node.setData({
      ...data,
      status,
      statusMsg,
    });
  },
};
</script>

<style></style>
