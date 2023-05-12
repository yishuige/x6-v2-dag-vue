<template>
  <div class="data-processing-dag-node">
    <div
      class="main-area"
      @mouseenter="onMainMouseEnter"
      @mouseleave="onMainMouseLeave"
    >
      <div class="main-info">
        <!-- 节点类型icon -->
        <i
          class="node-logo"
          :style="{
            backgroundImage: 'url(' + global.NODE_TYPE_LOGO[type] + ')',
          }"
        />
        <el-tooltip :content="name" placement="top" :open-delay="800">
          <div class="ellipsis-row node-name">{{ name }}</div>
        </el-tooltip>
      </div>

      <!-- 节点状态信息 -->
      <div class="status-action">
        <el-tooltip
          :content="statusMsg"
          v-if="status === global.CellStatus.ERROR"
          placement="top"
        >
          <i class="status-icon status-icon-error" />
        </el-tooltip>
        <i
          class="status-icon status-icon-success"
          v-if="status === global.CellStatus.SUCCESS"
        />
        <!-- 节点操作菜单 -->
        <div class="more-action-container">
          <i class="more-action" />
        </div>
      </div>
    </div>

    <!-- +号菜单 -->
    <div class="plus-dag" v-if="type !== global.NodeType.OUTPUT">
      <el-dropdown trigger="click">
        <i class="plus-action" />
        <!-- <i class="el-icon-circle-plus-outline el-icon--right"></i> -->
        <el-dropdown-menu
          slot="dropdown"
          placement="bottom"
          class="processing-node-menu"
        >
          <el-dropdown-item
            v-for="(item, index) in global.PROCESSING_TYPE_LIST"
            :key="index"
          >
            <div
              class="node-dropdown-item"
              @click="clickPlusDragMenu(item.type)"
            >
              <i
                class="node-mini-logo"
                :style="{
                  backgroundImage: `url(${global.NODE_TYPE_LOGO[item.type]})`,
                }"
              />
              {{ item.name }}
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import dagDictionary from './dagDictionary';

export default {
  inject: ['getNode'],

  data() {
    return {
      name: '',
      status: '',
      statusMsg: '',
      type: '',
    };
  },

  mounted() {
    let node = this.getNode();
    // 初始化数据绑定
    this.mapper(node.data, this.$data);
    // 节点数据变化监听，从而绑定数据
    node.on('change:data', ({ current }) => this.mapper(current, this.$data));
  },

  methods: {
    mapper(source, target) {
      for (let key in target) {
        target[key] = source[key] ?? target[key];
      }
    },

    // 鼠标进入矩形主区域的时候显示连接桩
    onMainMouseEnter() {
      let node = this.getNode();
      // 获取该节点下的所有连接桩
      const ports = node.getPorts() || [];
      ports.forEach((port) => {
        node.setPortProp(port.id, 'attrs/circle', {
          fill: '#fff',
          stroke: '#85A5FF',
        });
      });
    },

    // 鼠标离开矩形主区域的时候隐藏连接桩
    onMainMouseLeave() {
      let node = this.getNode();
      // 获取该节点下的所有连接桩
      const ports = node.getPorts() || [];
      ports.forEach((port) => {
        node.setPortProp(port.id, 'attrs/circle', {
          fill: 'transparent',
          stroke: 'transparent',
        });
      });
    },

    // 点击添加下游+号
    clickPlusDragMenu(type) {
      this.createDownstream(type);
      this.setState({
        plusActionSelected: false,
      });
    },

    // 创建下游的节点和边
    createDownstream(type) {
      let node = this.getNode();
      const { graph } = node.model || {};
      if (graph) {
        // 获取下游节点的初始位置信息
        const position = this.getDownstreamNodePosition(node, graph);
        // 创建下游节点
        const newNode = this.createNode(type, graph, position);
        const source = node.id;
        const target = newNode.id;
        // 创建该节点出发到下游节点的边
        this.createEdge(source, target, graph);
      }
    },

    /**
     * 创建边并添加到画布
     * @param source
     * @param target
     * @param graph
     */
    createEdge(source, target, graph) {
      const edge = {
        id: this.uuid(),
        shape: 'data-processing-curve',
        source: {
          cell: source,
          port: `${source}-out`,
        },
        target: {
          cell: target,
          port: `${target}-in`,
        },
        zIndex: -1,
        data: {
          source,
          target,
        },
      };
      if (graph) {
        graph.addEdge(edge);
      }
    },

    /**
     * 创建节点并添加到画布
     * @param type 节点类型
     * @param graph
     * @param position 节点位置
     * @returns
     */
    createNode(type, graph, position) {
      if (!graph) {
        return {};
      }
      let newNode = {};
      const sameTypeNodes = graph
        .getNodes()
        .filter((item) => item.getData()?.type === type);
      const typeName = this.global.PROCESSING_TYPE_LIST?.find(
        (item) => item.type === type
      )?.name;
      const id = this.uuid();
      const node = {
        id,
        shape: 'data-processing-dag-node',
        x: position?.x,
        y: position?.y,
        ports: this.getPortsByType(type, id),
        data: {
          name: `${typeName}_${sameTypeNodes.length + 1}`,
          type,
        },
      };
      newNode = graph.addNode(node);
      return newNode;
    },

    /**
     * 根据起点初始下游节点的位置信息
     * @param node 起始节点
     * @param graph
     * @returns
     */
    getDownstreamNodePosition(node, graph, dx = 250, dy = 100) {
      // 找出画布中以该起始节点为起点的相关边的终点id集合
      const downstreamNodeIdList = [];
      graph.getEdges().forEach((edge) => {
        const originEdge = edge.toJSON()?.data;
        if (originEdge.source === node.id) {
          downstreamNodeIdList.push(originEdge.target);
        }
      });
      // 获取起点的位置信息
      const position = node.getPosition();
      let minX = Infinity;
      let maxY = -Infinity;
      graph.getNodes().forEach((graphNode) => {
        if (downstreamNodeIdList.indexOf(graphNode.id) > -1) {
          const nodePosition = graphNode.getPosition();
          // 找到所有节点中最左侧的节点的x坐标
          if (nodePosition.x < minX) {
            minX = nodePosition.x;
          }
          // 找到所有节点中最x下方的节点的y坐标
          if (nodePosition.y > maxY) {
            maxY = nodePosition.y;
          }
        }
      });

      return {
        x: minX !== Infinity ? minX : position.x + dx,
        y: maxY !== -Infinity ? maxY + dy : position.y,
      };
    },

    // 根据节点的类型获取ports
    getPortsByType(type, nodeId) {
      let ports = [];
      switch (type) {
        case this.global.NodeType.INPUT:
          ports = [
            {
              id: `${nodeId}-out`,
              group: 'out',
            },
          ];
          break;
        case this.global.NodeType.OUTPUT:
          ports = [
            {
              id: `${nodeId}-in`,
              group: 'in',
            },
          ];
          break;
        default:
          ports = [
            {
              id: `${nodeId}-in`,
              group: 'in',
            },
            {
              id: `${nodeId}-out`,
              group: 'out',
            },
          ];
          break;
      }
      return ports;
    },

    uuid() {
      var s = [];
      var hexDigits = '0123456789abcdef';
      for (var i = 0; i < 32; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
      }
      s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
      s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
      s[8] = s[13] = s[18] = s[23];
      var uuid = s.join('');
      return uuid;
    },
  },

  computed: {
    global: function () {
      return dagDictionary;
    },
  },
};
</script>
