<template>
  <div :class="{ leftMenu: true, hide: !menuShowOK }">
    <div class="switch" @click="showMenu">
      <IconLeft :class="{ switch_hide: !menuShowOK, icon_btn: true }" />
    </div>

    <div class="titleType">厂房</div>
    <div class="moduleList">
      <div
        v-for="(item, index) in moduleList_cf"
        class="module"
        :style="`${item.show === false ? 'visibility:hidden' : ''}`"
        @click.stop="clickModule(item)"
      >
        <div class="title">{{ item.modelName }}</div>
        <img :src="item.thumbnail" style="width:100%;height:100%;" />
      </div>
    </div>

    <div class="titleType">工位</div>
    <div class="moduleList">
      <div
        v-for="(item, index) in moduleList"
        class="module"
        :style="`${item.show === false ? 'visibility:hidden' : ''}`"
        @click.stop="clickModule(item)"
      >
        <div class="title">{{ item.modelName }}</div>
        <img :src="item.thumbnail" style="width:100%;height:100%;" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  onMounted,
  watch,
  defineEmits,
} from 'vue';
import { IconLeft } from '@arco-design/web-vue/es/icon';
import { getModelListApi } from '@/api/digital-test-design';

const menuShowOK = ref(true);
const moduleList = ref([{}, {}, {}, {}, {}, {}]);
const emit = defineEmits(['clickModule']);

// 厂房列表
const moduleList_cf = ref([]);

onMounted(() => {
  handleModuleList();

  // 获取厂房模型
  getModelListApi({ modelType: 0 }).then(res => {
    moduleList_cf.value = [...res];
  });

  // 获取工位模型
  getModelListApi({ modelType: 3 }).then(res => {
    moduleList.value = [...res];
  });
});

const showMenu = () => {
  menuShowOK.value = !menuShowOK.value;
};

const handleModuleList = () => {
  if (moduleList.value.length % 2 !== 0) {
    moduleList.value.push({
      show: false,
    });
  }
};

const clickModule = (data) => {
  emit('clickModule', data);
};
</script>

<style lang="less" scoped>
.leftMenu {
  width: 300px;
  height: calc(100% - 0px);
  overflow-y: auto;
  overflow-x: hidden;
  border-right: 1px solid #000;
  position: absolute;
  top: 0;
  background: rgba(153, 169, 161, 0.8);
  transition: width 0.7s;

  &.hide {
    width: 0;
  }
}

.switch {
  width: 30px;
  height: 100px;
  border: 1px solid #165dff;
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto;
  transform: translateY(-50px);
  right: -30px;
  border-radius: 0 5px 5px 0;
}

.icon_btn {
  font-size: 26px;
  text-align: center;
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto;
  transform: rotateY(0deg);
  transition: transform 1s;
}

.switch_hide {
  transform: rotateY(180deg);
  transition: transform 1s;
}

.moduleList {
  width: 100%;
  height: auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  margin: 0 auto;
  padding: 20px 0;
  gap: 40px;
  align-content: flex-start;
  overflow: hidden;
}

.module {
  width: calc((100% - 80px) / 2);
  min-width: 100px;
  height: 100px;
  border: 1px solid rgb(56, 53, 53);
  cursor: pointer;
  position: relative;

  .title {
    position: absolute;
    bottom: -24px;
    text-align: center;
    width: 100%;
  }
}

.titleType {
  background: rgba(153, 169, 161, 1.0);
  padding: 10px;
  font-size: 16px;
  font-weight: 800;
}
</style>