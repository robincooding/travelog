import { createRouter, createWebHistory } from "vue-router";
import Landing from "./views/Landing.vue";
import CollectionList from "./views/CollectionList.vue";
import CollectionDetail from "./views/CollectionDetail.vue";
import CollectionForm from "./views/CollectionForm.vue";

const routes = [
  { path: "/", component: Landing },
  { path: "/collections", component: CollectionList },
  { path: "/collections/new", component: CollectionForm },
  { path: "/collections/:id", component: CollectionDetail },
  { path: "/collections/:id/edit", component: CollectionForm },
];

export default createRouter({ history: createWebHistory(), routes });
