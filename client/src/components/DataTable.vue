<script setup lang="ts" generic="TData, TValue">
import type { ColumnDef, Row, RowSelectionState, Updater } from '@tanstack/vue-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { computed, h, ref, toRef } from 'vue'
import Checkbox from './ui/checkbox/Checkbox.vue'
import { Button } from './ui/button'
import { valueUpdater } from '@/lib/utils'

// Declare the event we’ll emit when the selection changes
const emit = defineEmits<{
  'update:selected': [selection: TData[]]
}>()

const props = defineProps<{
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}>()

// A ref to hold the selected rows (the originals from props.data)
const rowSelection = ref({})

// We will need to refer to the table instance inside our row-selection callback,
// so declare a variable that we will assign once we create the table.
let table: ReturnType<typeof useVueTable<TData>>

// Create a computed value for our columns.
// We add a “selection” column at the start that renders checkboxes.
const renderColumns = computed(() => {
  return [
    {
      id: 'id-selection',
      // The header checkbox will control “select all”
      header: () =>
        h(Checkbox, {
          // When available, we show the “all selected” and “indeterminate” states from the table
          checked: table.getIsAllPageRowsSelected(),
          'onUpdate:checked': (checked: boolean) => {
            // Toggle all rows based on the header checkbox’s new state.
            if (table) {
              table.toggleAllRowsSelected(!!checked)
            }
          },
        }),
      // In each cell we render a checkbox that reflects and toggles that row’s selection
      cell: (cellProps: { row: Row<TData> }) =>
        h(Checkbox, {
          checked: cellProps.row.getIsSelected(),
          'onUpdate:checked': (checked: boolean) => {
            // Toggle the selection state for this row.
            cellProps.row.toggleSelected(!!checked)
          },
        }),
      enableSorting: false,
      enableHiding: false,
    },
    // Then include the columns passed in via props.
    ...props.columns,
  ]
})

const pagination = ref({
  pageSize: 10,
  pageIndex: 0,
})

// Now create the table instance. Notice we pass our setRowSelection callback so that
// whenever the table’s internal selection changes, our function will be called.
table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return renderColumns.value
  },
  getCoreRowModel: getCoreRowModel(),
  onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
  getPaginationRowModel: getPaginationRowModel(),
  state: {
    get rowSelection() {
      return rowSelection.value
    },

    // get pagination() {
    //   return pagination.value
    // },

    // set pagination(value) {
    //   pagination.value = value
    // },
  },
})
</script>

<template>
  <div class="border rounded-md w-full">
    <Table>
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="whitespace-nowrap"
        >
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <!-- Render the header content -->
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="table.getRowModel().rows?.length">
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            :data-state="row.getIsSelected() ? 'selected' : undefined"
          >
            <TableCell
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              class="whitespace-nowrap"
            >
              <!-- Render the cell content -->
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow>
            <!-- Adjust colspan as needed (here using the number of provided columns) -->
            <TableCell :colspan="props.columns.length + 1" class="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
  <div class="flex items-center justify-end py-4 space-x-2">
    <Button
      variant="outline"
      size="sm"
      :disabled="!table.getCanPreviousPage()"
      @click="table.previousPage()"
    >
      Previous
    </Button>
    <Button
      variant="outline"
      size="sm"
      :disabled="!table.getCanNextPage()"
      @click="table.nextPage()"
    >
      Next
    </Button>
  </div>
</template>
