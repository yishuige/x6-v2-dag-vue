import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'One',
    component: () => import('../views/OneNode.vue'),
  },
  {
    path: '/two',
    name: 'Two',
    component: () => import('../views/TwoNode.vue'),
  },
  {
    path: '/more',
    name: 'More',
    component: () => import('../views/MoreNode.vue'),
  },
];

const router = new VueRouter({
  routes,
});

export default router;
