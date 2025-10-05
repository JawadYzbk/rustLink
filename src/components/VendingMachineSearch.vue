<template>
  <Transition name="slide-up">
    <div v-if="isShowing" class="bg-gray-900 rounded-lg text-white z-vending-machine-contents shadow-2xl border border-gray-700" style="width:350px;">

      <!-- header -->
      <div class="flex flex-col p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-t-lg">

        <div class="flex mb-3">
          <svg class="flex-none my-auto mr-3 w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>

          <div class="flex-grow my-auto text-lg font-semibold">Vending Machine Search</div>

          <div class="flex-none my-auto ml-2">
            <button @click="$emit('close')" type="button" class="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-gray-400 bg-gray-600 hover:bg-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- buy/sell selector -->
        <div class="flex mb-3">
          <div class="w-full">
            <select
              v-model="orderType"
              class="custom-select w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option v-for="option in orderOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- search -->
        <div class="flex-grow">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input v-model="searchText" type="text" class="bg-gray-700 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full transition-all duration-200 placeholder-gray-400" placeholder="Search for items..."/>
            <div v-if="searchText" class="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button @click="searchText = ''" class="text-gray-400 hover:text-white transition-colors duration-200">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- results -->
      <div class="p-4 overflow-y-auto" style="height:400px;">

        <div v-if="vendingMachinesWithSearchedItems.length === 0 && searchText" class="text-center py-8 text-gray-400">
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a7.966 7.966 0 00-6-2.75 7.966 7.966 0 00-6 2.75m12 0v.5a7.966 7.966 0 01-6 2.75 7.966 7.966 0 01-6-2.75v-.5m12 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v.5"></path>
          </svg>
          <p class="text-lg font-medium">No results found</p>
          <p class="text-sm">Try searching for a different item</p>
        </div>

        <div v-for="vendingMachine in vendingMachinesWithSearchedItems" :key="vendingMachine.id" class="mb-4 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700">

          <div @click="showVendingMachine(vendingMachine)" class="flex bg-gradient-to-r from-gray-700 to-gray-600 p-3 cursor-pointer hover:from-gray-600 hover:to-gray-500 transition-all duration-200">
            <img class="flex-none my-auto h-6 w-6 mr-3" src="images/map/shop_green.png"/>
            <div class="flex-grow my-auto text-sm font-medium">{{vendingMachine.name}}</div>
            <div class="flex-none my-auto ml-2 text-gray-300">
              <svg class="w-4 h-4 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>

          <div class="bg-gray-800 p-3">
            <div v-if="vendingMachine.sellOrders.length > 0" class="space-y-2">
              <div v-for="sellOrder in vendingMachine.sellOrders" v-if="shouldShowOrder(sellOrder)" :key="sellOrder.id" class="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors duration-200">
                <div class="flex items-center space-x-3">
                  
                  <!-- stock -->
                  <div class="flex-shrink-0">
                    <div class="bg-gray-600 rounded-lg p-2 text-center min-w-[60px]">
                      <div class="text-xs text-gray-300 mb-1">Stock</div>
                      <div class="text-lg font-bold text-white">{{sellOrder.amountInStock}}</div>
                    </div>
                  </div>

                  <!-- item for sale / wanted item -->
                  <div class="flex-1">
                    <div @click="$emit('item-click', orderType === 'sell' ? sellOrder.itemId : sellOrder.currencyId)" class="bg-gray-600 rounded-lg p-2 cursor-pointer hover:bg-gray-500 transition-colors duration-200 relative">
                      <div class="text-xs text-gray-300 mb-2">{{ orderType === 'sell' ? 'Selling' : 'Wants' }}</div>
                      <div class="flex items-center">
                        <div class="relative mr-3">
                          <img v-if="orderType === 'sell' ? sellOrder.itemIsBlueprint : sellOrder.currencyIsBlueprint" class="absolute -top-1 -right-1 z-10" src="images/blueprint.png" width="20" height="20"/>
                          <img class="rounded" :src="getItemImage(orderType === 'sell' ? sellOrder.itemId : sellOrder.currencyId) || 'images/unknown_item.png'" width="40" height="40" onerror="this.src = 'images/unknown_item.png';"/>
                        </div>
                        <div class="flex-1">
                          <div class="text-white font-medium">x{{orderType === 'sell' ? sellOrder.quantity : sellOrder.costPerItem}}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- currency item / offering item -->
                  <div class="flex-1">
                    <div @click="$emit('item-click', orderType === 'sell' ? sellOrder.currencyId : sellOrder.itemId)" class="bg-gray-600 rounded-lg p-2 cursor-pointer hover:bg-gray-500 transition-colors duration-200 relative">
                      <div class="text-xs text-gray-300 mb-2">{{ orderType === 'sell' ? 'For' : 'Offers' }}</div>
                      <div class="flex items-center">
                        <div class="relative mr-3">
                          <img v-if="orderType === 'sell' ? sellOrder.currencyIsBlueprint : sellOrder.itemIsBlueprint" class="absolute -top-1 -right-1 z-10" src="images/blueprint.png" width="20" height="20"/>
                          <img class="rounded" :src="getItemImage(orderType === 'sell' ? sellOrder.currencyId : sellOrder.itemId) || 'images/unknown_item.png'" width="40" height="40" onerror="this.src = 'images/unknown_item.png';"/>
                        </div>
                        <div class="flex-1">
                          <div class="text-white font-medium">x{{orderType === 'sell' ? sellOrder.costPerItem : sellOrder.quantity}}</div>
                        </div>
                      </div>
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

/* Custom native select styling */
.custom-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

.custom-select:hover {
  border-color: #6b7280;
}

.custom-select option {
  background-color: #374151;
  color: white;
}
</style>

<script>
export default {
  name: 'VendingMachineSearch',
  props: {
    isShowing: Boolean,
    vendingMachines: Array,
  },
  data: function() {
    return {
      items: null,
      searchText: "",
      orderType: "sell", // 'sell' or 'buy'
      orderOptions: [
        { label: '🛒 Sell Orders (Items for Sale)', value: 'sell' },
        { label: '💰 Buy Orders (Items Wanted)', value: 'buy' }
      ]
    };
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
    showVendingMachine(vendingMachine) {
      this.$emit('show-vending-machine', vendingMachine);
    },
    shouldShowOrder(sellOrder) {
      if (this.orderType === 'sell') {
        // Show if the item being sold matches the search
        return this.searchedItemIds.includes(sellOrder.itemId);
      } else if (this.orderType === 'buy') {
        // Show if the currency (item wanted) matches the search
        return this.searchedItemIds.includes(sellOrder.currencyId);
      }
      return false;
    },
  },
  computed: {

    /**
     * Returns an array of item ids where the item name contains the search text.
     */
    searchedItemIds: function() {
      return this.items ? this.items.filter((item) => {
        return item.name.toLowerCase().indexOf(this.searchText.toLowerCase()) !== -1;
      }).map((item) => {
        return item.id;
      }) : [];
    },

    /**
     * Returns an array of vending machines that contain at least one item in the searchedItemIds array.
     */
    vendingMachinesWithSearchedItems: function() {
      return this.vendingMachines ? this.vendingMachines.filter((vendingMachine) => {

        if (this.orderType === 'sell') {
          // Original logic: search for items being sold
          var itemIdsForSale = vendingMachine.sellOrders.map((sellOrder) => sellOrder.itemId);

          for(var i=0; i < itemIdsForSale.length; i++){
            var itemIdForSale = itemIdsForSale[i];
            if(this.searchedItemIds.includes(itemIdForSale)){
              return true;
            }
          }
        } else if (this.orderType === 'buy') {
          // Buy orders logic: search for items being wanted (currencyId in sell orders)
          var currencyIdsWanted = vendingMachine.sellOrders.map((sellOrder) => sellOrder.currencyId);

          for(var i=0; i < currencyIdsWanted.length; i++){
            var currencyIdWanted = currencyIdsWanted[i];
            if(this.searchedItemIds.includes(currencyIdWanted)){
              return true;
            }
          }
        }

        return false;

      }) : [];
    },

  }
}
</script>
