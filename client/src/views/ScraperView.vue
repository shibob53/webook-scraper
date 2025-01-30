<script lang="ts" setup>
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-vue-next'
</script>

<template>
  <DashboardLayout title="Scraper">
    <div class="bg-muted p-3 rounded-lg flex items-center justify-between">
      <div class="text-muted-foreground">Scraper is <span class="font-bold">Off</span></div>
      <div>
        <Button> <Play class="size-4" /> Start </Button>
      </div>
    </div>
  </DashboardLayout>
</template>

<style></style>
