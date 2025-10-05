<template>
  <Transition name="slide-up">
    <div v-if="vendingMachine" class="bg-gray-900 rounded-lg text-white z-vending-machine-contents shadow-2xl border border-gray-700" style="width:350px;">

      <!-- header -->
      <div class="flex flex-col p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-t-lg">
        <div class="flex mb-3">
          <img class="flex-none my-auto w-5 h-5 mr-3" src="images/map/shop_green.png"/>
          <div class="flex-grow my-auto text-lg font-semibold">{{ vendingMachine.name }}</div>
          <div class="flex-none my-auto ml-2">
            <button @click="$emit('close')" type="button" class="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-gray-400 bg-gray-600 hover:bg-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- sell orders -->
      <div class="p-4 overflow-y-auto" style="height:400px;">
        <div v-if="vendingMachine.sellOrders.length === 0" class="text-center py-8 text-gray-400">
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          <p class="text-lg font-medium">Vending Machine is Empty</p>
          <p class="text-sm">No items available for purchase</p>
        </div>

        <div v-else class="space-y-3">
          <div v-for="sellOrder in vendingMachine.sellOrders" :key="sellOrder.id" class="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors duration-200 border border-gray-700">
            <div class="flex items-center space-x-3">
              
              <!-- stock -->
              <div class="flex-shrink-0">
                <div class="bg-gray-600 rounded-lg p-2 text-center min-w-[60px]">
                  <div class="text-xs text-gray-300 mb-1">Stock</div>
                  <div class="text-lg font-bold text-white">{{sellOrder.amountInStock}}</div>
                </div>
              </div>

              <!-- item for sale -->
              <div class="flex-1">
                <div @click="onItemClick(sellOrder.itemId)" class="bg-gray-600 rounded-lg p-2 cursor-pointer hover:bg-gray-500 transition-colors duration-200 relative">
                  <div class="text-xs text-gray-300 mb-2">Selling</div>
                  <div class="flex items-center">
                    <div class="relative mr-3">
                      <img v-if="sellOrder.itemIsBlueprint" class="absolute -top-1 -right-1 z-10" src="images/blueprint.png" width="20" height="20"/>
                      <img class="rounded" :src="getItemImage(sellOrder.itemId) || 'images/unknown_item.png'" width="40" height="40" onerror="this.src = 'images/unknown_item.png';"/>
                    </div>
                    <div class="flex-1">
                      <div class="text-white font-medium">x{{sellOrder.quantity}}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- currency item -->
              <div class="flex-1">
                <div @click="onItemClick(sellOrder.currencyId)" class="bg-gray-600 rounded-lg p-2 cursor-pointer hover:bg-gray-500 transition-colors duration-200 relative">
                  <div class="text-xs text-gray-300 mb-2">For</div>
                  <div class="flex items-center">
                    <div class="relative mr-3">
                      <img v-if="sellOrder.currencyIsBlueprint" class="absolute -top-1 -right-1 z-10" src="images/blueprint.png" width="20" height="20"/>
                      <img class="rounded" :src="getItemImage(sellOrder.currencyId) || 'images/unknown_item.png'" width="40" height="40" onerror="this.src = 'images/unknown_item.png';"/>
                    </div>
                    <div class="flex-1">
                      <div class="text-white font-medium">x{{sellOrder.costPerItem}}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}
.slide-up-enter,
.slide-up-leave-to {
  transform: translateY(100vh);
  opacity: 0;
}
</style>

<script>
export default {
  name: 'VendingMachineContents',
  props: {
    vendingMachine: Object,
  },
  data() {
    return {
      items: {

      },
    }
  },
  mounted() {
    this.items = require('@/items.json');
  },
  methods: {
    findItemById(id) {
      return this.items.find(item => item.id === id);
    },
    getItemImage(id) {
      var item = this.findItemById(id);
      return item ? `images/items/${item.shortname}.png` : null;
    },
    onItemClick(id) {
      this.$emit('item-click', id);
    },
  },
}
</script>
