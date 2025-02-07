<script lang="ts" setup>
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { Button } from '@/components/ui/button'
import { Play, StopCircle } from 'lucide-vue-next'
import { useScraperStore } from '@/stores/scraper'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogTrigger from '@/components/ui/dialog/DialogTrigger.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import Label from '@/components/ui/label/Label.vue'
import Input from '@/components/ui/input/Input.vue'
import NumberField from '@/components/ui/number-field/NumberField.vue'
import NumberFieldIncrement from '@/components/ui/number-field/NumberFieldIncrement.vue'
import NumberFieldDecrement from '@/components/ui/number-field/NumberFieldDecrement.vue'
import NumberFieldContent from '@/components/ui/number-field/NumberFieldContent.vue'
import NumberFieldInput from '@/components/ui/number-field/NumberFieldInput.vue'
import { ref } from 'vue'
import { useSocket } from '@/stores/socket'

const store = useScraperStore()

const nbAccountsToUse = ref(1)
const url = ref('')
const socket = useSocket()
</script>

<template>
  <DashboardLayout title="Scraper">
    <div class="bg-muted p-3 rounded-lg flex items-center justify-between">
      <div class="text-muted-foreground">Scraper is <span class="font-bold">Off</span></div>
      <div>
        <Dialog>
          <DialogTrigger v-if="!store.settings.started">
            <Button> <Play class="size-4" /> Start </Button>
          </DialogTrigger>
          <Button v-else variant="destructive" @click="store.stop">
            <StopCircle class="size-4" /> Stop
          </Button>

          <DialogContent class="space-y-2">
            <div>
              <Label for="event"> Event URL </Label>
              <Input
                v-model="url"
                id="event"
                name="event"
                type="url"
                placeholder="https://webook.com/en/events/example-event-1234/"
              />
            </div>
            <div>
              <NumberField
                id="accounts"
                :default-value="1"
                :min="1"
                :max="555"
                v-model="nbAccountsToUse"
              >
                <Label for="accounts">Accounts to use</Label>
                <NumberFieldContent>
                  <NumberFieldDecrement />
                  <NumberFieldInput />
                  <NumberFieldIncrement />
                </NumberFieldContent>
              </NumberField>
            </div>
            <div>
              <Button @click="store.start(url, nbAccountsToUse)"> Start scraping </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <div class="mt-4">
      <div class="text-lg font-semibold">Scraper Logs:</div>
      <div class="space-y-2 mt-2 bg-neutral-600 p-2">
        <div v-for="entry in socket.logs">
          <div class="text-sm font-mono">
            <span class="text-blue-400">[{{ entry.kind }}]</span> {{ entry.message }}
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style></style>
