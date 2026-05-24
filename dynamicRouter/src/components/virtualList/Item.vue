<!-- Item.vue -->
<template>
  <div>
    <p style="margin: 0">
      <span style="color: red; font-weight: bold;">{{ item.id }}</span>
      <span style="margin-left: 8px;">{{ item.value }}</span>
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})
</script>