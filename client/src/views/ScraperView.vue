<script lang="ts" setup>
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Play, StopCircle } from 'lucide-vue-next'
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
import { onMounted, ref, watch } from 'vue'
import { useSocket } from '@/stores/socket'
import Switch from '@/components/ui/switch/Switch.vue'

const store = useScraperStore()

const nbAccountsToUse = ref(1)
const url = ref('')
const socket = useSocket()
const showModal = ref(false)
const showLogs = ref(false)
const showSettings = ref(false)

watch(
  () => store.settings,
  () => {
    setTimeout(() => {
      store.saveSettings()
    }, 40)
  },
  { deep: true },
)

onMounted(() => {
  store.fetchSettings()
})

const errors = ref({
  url: '',
})

const start = async () => {
  if (!url.value) {
    errors.value.url = 'URL is required'
    return
  }
  if (!url.value.startsWith('https://webook.com/')) {
    errors.value.url = 'Url should be a webook event'
    return
  }

  if (url.value.endsWith('/book')) {
    errors.value.url = 'Invalid URL'
    return
  }
  store.start(url.value, nbAccountsToUse.value)
  showModal.value = false
  url.value = ''
}
</script>

<template>
  <DashboardLayout title="Scraper">
    <div class="bg-muted p-3 rounded-lg flex items-center justify-between">
      <div class="text-muted-foreground">Scraper is <span class="font-bold">Off</span></div>
      <div>
        <Dialog v-model:open="showModal">
          <DialogTrigger>
            <Button> <Play class="size-4" /> Scrape Event </Button>
          </DialogTrigger>

          <DialogContent class="space-y-2">
            <div>
              <Label for="event" :class="errors.url ? 'text-destructive' : ''"> Event URL </Label>
              <Input
                v-model="url"
                @focus="errors.url = ''"
                :class="errors.url ? 'border-destructive' : ''"
                id="event"
                name="event"
                type="url"
                placeholder="https://webook.com/en/events/example-event-1234/"
              />
              <div v-if="errors.url" class="text-sm text-destructive">{{ errors.url }}</div>
            </div>
            <div>
              <NumberField
                id="accounts"
                :default-value="1"
                :min="1"
                :max="555"
                v-model="nbAccountsToUse"
              >
                <Label for="accounts">Simultaneous connections</Label>
                <NumberFieldContent>
                  <NumberFieldDecrement />
                  <NumberFieldInput />
                  <NumberFieldIncrement />
                </NumberFieldContent>
              </NumberField>
            </div>
            <div class="flex items-center gap-2">
              <Switch />
              <Label>Queue for later (book when available)</Label>
            </div>
            <div>
              <Button @click="start"> Start scraping </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <div>
      <!-- Settings -->
      <!-- 
      minPrice: 0,
      maxPrice: 0,
      maxTickets: 0,
      useProxies: false,
      discordWebhook: '',
      recheckInterval: 0,
      ramdomMode: false, -->

      <div class="mt-4">
        <div class="flex justify-between items-center">
          <div class="text-lg font-semibold">Settings:</div>
          <Button
            v-if="showSettings"
            @click="showSettings = !showSettings"
            size="sm"
            variant="ghost"
            >Hide <ChevronUp />
          </Button>
          <Button v-else size="sm" @click="showSettings = !showSettings" variant="ghost"
            >Show <ChevronDown />
          </Button>
        </div>
        <div class="space-y-4 mt-2 p-2" v-if="showSettings">
          <div class="space-y-5 mt-2 p-2 lg:w-2/4">
            <div class="flex items-center gap-2">
              <Switch v-model:checked="store.settings.useProxies" />
              <Label>Use Proxies</Label>
            </div>

            <div class="flex items-center gap-2">
              <Switch v-model:checked="store.settings.randomMode" />
              <Label>Random Mode</Label>
            </div>

            <div class="space-y-4">
              <div>
                <Label for="discord"> Discord Webhook </Label>
                <Input
                  v-model="store.settings.discordWebhook"
                  id="discord"
                  name="discord"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>

              <div class="lg:max-w-sm max-w-full">
                <Label for="recheck"> Recheck Interval </Label>
                <NumberField
                  id="recheck"
                  :default-value="store.settings.recheckInterval"
                  :min="0"
                  :max="60"
                  v-model="store.settings.recheckInterval"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>

              <div class="lg:max-w-sm max-w-full">
                <Label for="minPrice"> Min Price </Label>
                <NumberField
                  id="minPrice"
                  :default-value="store.settings.minPrice"
                  :min="0"
                  :max="1000"
                  v-model="store.settings.minPrice"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>

              <div class="lg:max-w-sm max-w-full">
                <Label for="maxPrice"> Max Price </Label>
                <NumberField
                  id="maxPrice"
                  :default-value="store.settings.maxPrice"
                  :min="0"
                  :max="1000"
                  v-model="store.settings.maxPrice"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>

              <div class="lg:max-w-sm max-w-full">
                <Label for="maxTickets"> Max Tickets held per account </Label>
                <NumberField
                  id="maxTickets"
                  :default-value="store.settings.maxTickets"
                  :min="0"
                  :max="5"
                  v-model="store.settings.maxTickets"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>

              <div>
                <Button @click="store.saveSettings"> Save </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">Scraper Logs:</div>
        <Button v-if="showLogs" @click="showLogs = !showLogs" size="sm" variant="ghost"
          >Hide <ChevronUp />
        </Button>
        <Button v-else size="sm" @click="showLogs = !showLogs" variant="ghost"
          >Show <ChevronDown />
        </Button>
      </div>
      <div v-if="showLogs" class="space-y-2 mt-2 bg-neutral-600 p-2">
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
