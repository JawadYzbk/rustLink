<template>
  <div id="app">

    <!-- Steam is Connected -->
    <template v-if="isRustPlusConnected">
      <div class="h-screen flex flex-col">

        <!-- Main -->
        <div class="flex-grow flex h-full">

          <!-- Left Side -->
          <div class="flex-none h-full flex flex-col">

            <!-- Logo -->
            <div class="flex-none flex py-4 bg-gray-800">
              <a target="_blank" href="https://github.com/JawadYzbk/rustLink" class="mx-auto inline-flex items-center justify-center">
                <img src="images/icon.png" alt="RustLink" class=" h-14 w-14 rounded-md shadow"/>
              </a>
            </div>

            <!-- Divider -->
            <div class="border border-gray-700"></div>

            <!-- Server Side Panel -->
            <ServerSidePanel class="flex-grow" :servers="servers" :selectedServer="selectedServer" @server-selected="onServerSelected"/>

            <!-- Bottom Buttons -->
            <div class="flex-none bg-gray-800 py-4">

              <!-- About Button -->
              <div class="flex mb-4">
                <button @click="isShowingAboutModal = true" type="button" class="mx-auto inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-gray-700 bg-gray-300 hover:bg-gray-200 focus:outline-none">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </button>
              </div>

              <!-- Global Notification Center Button -->
              <div class="flex mb-4">
                <button @click="isShowingGlobalNotificationCenter = !isShowingGlobalNotificationCenter" type="button" class="mx-auto inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-gray-700 bg-gray-300 hover:bg-gray-200 focus:outline-none relative">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  <!-- Notification Badge -->
                  <span v-if="unreadGlobalNotificationsCount > 0" class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {{ unreadGlobalNotificationsCount > 99 ? '99+' : unreadGlobalNotificationsCount }}
                  </span>
                </button>
              </div>

              <!-- Logout Button -->
              <div class="flex mb-4">
                <button @click="isShowingLogoutModal = true" type="button" class="mx-auto inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-gray-700 bg-gray-300 hover:bg-gray-200 focus:outline-none">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                </button>
              </div>

              <!-- Steam Account Button -->
              <div class="flex-none flex bg-gray-800">
                <img @click="isShowingLogoutModal = true" :src="'https://companion-rust.facepunch.com/api/avatar/' + this.steamId" alt="" class="mx-auto inline-flex items-center justify-center h-14 w-14 rounded-md bg-gray-300 shadow cursor-pointer border-2 border-gray-500 hover:border-gray-400"/>
              </div>

            </div>

          </div>

          <!-- Right Side -->
          <div class="flex flex-col flex-grow h-full overflow-y-scroll">

            <!-- User has selected a Server -->
            <RustPlus ref="rustPlusComponent" v-if="selectedServer" :server="selectedServer" @remove-server="confirmRemoveServer($event)"/>

            <!-- User hasn't selected a Server -->
            <NoServerSelected v-else @add-server-manually="isShowingAddServerModal = true"/>

            <!-- Bottom Bar -->
            <div class="flex-none flex bg-gray-700 px-4 py-2 text-white z-bottom-bar">

              <div class="flex-grow">

                <!-- fcm status -->
                <div class="flex text-xs">
                  <svg class="my-auto w-3 h-3 mr-1" viewBox="0 0 24 24" :class="{
                  'text-yellow-500': this.fcmStatus === 'not_ready',
                  'text-green-500': this.fcmStatus === 'ready',
                  'text-red-500': this.fcmStatus === 'error',
                }">
                    <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                  </svg>
                  <span @click="isShowingFcmInfoModal = true" class="my-auto cursor-pointer hover:text-gray-300">FCM Status: {{ fcmStatusMessage }}</span>
                </div>

                <!-- expo status -->
                <div class="flex text-xs">
                  <svg class="my-auto w-3 h-3 mr-1" viewBox="0 0 24 24" :class="{
                  'text-yellow-500': this.expoStatus === 'not_ready',
                  'text-green-500': this.expoStatus === 'ready',
                  'text-red-500': this.expoStatus === 'error',
                }">
                    <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                  </svg>
                  <span @click="isShowingExpoInfoModal = true" class="my-auto cursor-pointer hover:text-gray-300">Expo Status: {{ expoStatusMessage }}</span>
                </div>

                <!-- companion push status -->
                <div class="flex text-xs">
                  <svg class="my-auto w-3 h-3 mr-1" viewBox="0 0 24 24" :class="{
                  'text-yellow-500': this.companionPushStatus === 'not_ready',
                  'text-green-500': this.companionPushStatus === 'ready',
                  'text-red-500': this.companionPushStatus === 'error',
                }">
                    <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                  </svg>
                  <span @click="isShowingCompanionPushInfoModal = true" class="my-auto cursor-pointer hover:text-gray-300">Rust+ Status: {{ companionPushStatusMessage }}</span>
                </div>

              </div>

              <div class="flex flex-col text-white text-xs my-auto text-right">
                <div>RustLink v{{ appversion }}</div>
                <div class="flex mx-auto">
                  <div>New Features with</div>
                  <div class="mx-1 text-red-500">
                    <svg class="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </div>
                  <div>by <a class="hover:text-gray-300" target="_blank" href="https://github.com/JawadYzbk">Jawad Yzbk</a></div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </template>

    <!-- Steam not Connected -->
    <ConnectRustPlus v-else @rustplus-connected="onRustPlusConnected($event)"/>

    <!-- Modals -->
    <AboutModal @close="isShowingAboutModal = false" :isShowing="isShowingAboutModal"/>
    <AddServerModal @add="onAddServer($event)" @close="isShowingAddServerModal = false" :isShowing="isShowingAddServerModal" :steamId="steamId"/>
    <PairServerModal @pair="onAddServer($event)" @close="isShowingPairServerModal = false" :isShowing="isShowingPairServerModal" :notification="lastReceivedPairNotification"/>
    <LogoutModal @close="isShowingLogoutModal = false" @logout="logout" :isShowing="isShowingLogoutModal"/>
    <RemoveServerModal @close="isShowingRemoveServerModal = false" @remove="removeServer" :isShowing="isShowingRemoveServerModal"/>
    <InfoModal @close="isShowingFcmInfoModal = false" :isShowing="isShowingFcmInfoModal" title="Firebase Cloud Messaging" message="We need to register with Firebase Cloud Messaging to be able to receive pairing notifications from the Rust+ Companion API."/>
    <InfoModal @close="isShowingExpoInfoModal = false" :isShowing="isShowingExpoInfoModal" title="Expo Push Token" message="We need to register our Firebase Cloud Messaging token with Expo, so we can send an Expo Push Token to the Rust+ Companion API."/>
    <InfoModal @close="isShowingCompanionPushInfoModal = false" :isShowing="isShowingCompanionPushInfoModal" title="Rust+ Companion API" message="We need to register with the Rust+ Companion API to be able to receive pairing notifications from the in game menus in Rust."/>

    <!-- Global Notification Center Modal -->
    <div v-if="isShowingGlobalNotificationCenter" class="fixed inset-0 overflow-y-auto" style="z-index: 9999;">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity" aria-hidden="true">
          <div class="absolute inset-0 bg-gray-500 opacity-75" @click="isShowingGlobalNotificationCenter = false"></div>
        </div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Global Notifications
                </h3>
                <div class="max-h-96 overflow-y-auto">
                  <div v-if="globalNotifications.length === 0" class="text-gray-500 text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h6m2 13V9a2 2 0 00-2-2H8" />
                    </svg>
                    <p class="text-sm">No notifications yet</p>
                    <p class="text-xs text-gray-400 mt-1">Notifications will appear here when received</p>
                  </div>
                  <div v-else class="space-y-3">
                    <div v-for="notification in globalNotifications" :key="notification.id" 
                         class="group relative p-4 border rounded-xl transition-all duration-200 hover:shadow-md cursor-pointer"
                         :class="{ 
                           'bg-white border-gray-200 hover:border-gray-300': notification.read, 
                           'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300 shadow-sm': !notification.read 
                         }"
                         @click="markGlobalNotificationAsRead(notification.id)">
                      
                      <!-- Unread indicator dot -->
                      <div v-if="!notification.read" class="absolute top-4 left-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                      
                      <div class="flex items-start space-x-3" :class="{ 'ml-4': !notification.read }">
                        <!-- Notification Icon -->
                        <div class="flex-shrink-0 mt-0.5">
                          <div class="w-8 h-8 rounded-full flex items-center justify-center" 
                               :class="getGlobalNotificationIconBg(notification)">
                            <!-- Pairing notification icon -->
                            <svg v-if="notification.channel === 1001 || notification.type === 'pairing'" 
                                 class="w-4 h-4" :class="getGlobalNotificationIconColor(notification)" 
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <!-- Player logged in icon -->
                            <svg v-else-if="notification.channel === 1002 || notification.type === 'player_login'" 
                                 class="w-4 h-4" :class="getGlobalNotificationIconColor(notification)" 
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <!-- Player died icon -->
                            <svg v-else-if="notification.channel === 1003 || notification.type === 'player_death'" 
                                 class="w-4 h-4" :class="getGlobalNotificationIconColor(notification)" 
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <!-- Smart alarm icon -->
                            <svg v-else-if="notification.channel === 1004 || notification.type === 'smart_alarm'" 
                                 class="w-4 h-4" :class="getGlobalNotificationIconColor(notification)" 
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <!-- Team message icon -->
                            <svg v-else-if="notification.type === 'team_message'" 
                                 class="w-4 h-4" :class="getGlobalNotificationIconColor(notification)" 
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <!-- Team changed icon -->
                            <svg v-else-if="notification.type === 'team_changed'" 
                                 class="w-4 h-4" :class="getGlobalNotificationIconColor(notification)" 
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <!-- Entity changed icon -->
                            <svg v-else-if="notification.type === 'entity_changed'" 
                                 class="w-4 h-4" :class="getGlobalNotificationIconColor(notification)" 
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <!-- Default notification icon -->
                            <svg v-else class="w-4 h-4" :class="getGlobalNotificationIconColor(notification)" 
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h6m2 13V9a2 2 0 00-2-2H8" />
                            </svg>
                          </div>
                        </div>
                        
                        <!-- Notification Content -->
                        <div class="flex-grow min-w-0">
                          <div class="flex items-start justify-between">
                            <div class="flex-grow">
                              <h4 class="font-semibold text-gray-900 text-sm leading-5 mb-1">
                                {{ notification.title }}
                              </h4>
                              <p class="text-sm text-gray-600 leading-5 mb-2">
                                {{ notification.message }}
                              </p>
                              
                              <!-- Metadata row -->
                              <div class="flex items-center space-x-3 text-xs text-gray-500">
                                <span class="flex items-center">
                                  <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {{ formatNotificationTime(notification.timestamp) }}
                                </span>
                                
                                <span v-if="notification.serverName && notification.serverName !== 'Unknown Server'" 
                                      class="flex items-center px-2 py-1 bg-gray-100 rounded-full">
                                  <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                  </svg>
                                  {{ notification.serverName }}
                                </span>
                                
                                <span v-if="getNotificationTypeLabel(notification)" 
                                      class="px-2 py-1 rounded-full text-xs font-medium"
                                      :class="getNotificationTypeBadgeClass(notification)">
                                  {{ getNotificationTypeLabel(notification) }}
                                </span>
                              </div>
                            </div>
                            
                            <!-- Action button -->
                            <div class="flex-shrink-0 ml-4">
                              <button v-if="!notification.read" 
                                      @click.stop="markGlobalNotificationAsRead(notification.id)" 
                                      class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">
                                Mark as read
                              </button>
                              <div v-else class="text-xs text-gray-400 font-medium">
                                Read
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
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button @click="clearAllGlobalNotifications" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
              Clear All
            </button>
            <button @click="isShowingGlobalNotificationCenter = false" type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import AboutModal from "@/components/modals/AboutModal";
import InfoModal from "@/components/modals/InfoModal";
import AddServerModal from "@/components/modals/AddServerModal";
import PairServerModal from "@/components/modals/PairServerModal";
import LogoutModal from "@/components/modals/LogoutModal";
import RemoveServerModal from "@/components/modals/RemoveServerModal";
import ConnectRustPlus from '@/components/ConnectRustPlus.vue'
import ServerSidePanel from '@/components/ServerSidePanel.vue'
import RustPlus from '@/components/RustPlus.vue'
import NoServerSelected from '@/components/NoServerSelected.vue'

const Status = {
  NOT_READY: "not_ready",
  READY: "ready",
  ERROR: "error",
}

export default {
  name: 'App',
  components: {
    InfoModal,
    AboutModal,
    RemoveServerModal,
    LogoutModal,
    AddServerModal,
    PairServerModal,
    ConnectRustPlus,
    ServerSidePanel,
    RustPlus,
    NoServerSelected,
  },
  data: function() {
    return {

      appversion: window.appversion,

      steamId: null,
      rustplusToken: null,

      servers: [],
      selectedServer: null,

      fcmStatus: Status.NOT_READY,
      expoStatus: Status.NOT_READY,
      companionPushStatus: Status.NOT_READY,

      fcmStatusMessage: "Not Ready",
      expoStatusMessage: "Not Ready",
      companionPushStatusMessage: "Not Ready",

      fcmNotificationReceiver: null,
      expoPushTokenReceiver: null,
      rustCompanionReceiver: null,

      isShowingAboutModal: false,
      isShowingAddServerModal: false,
      isShowingPairServerModal: false,
      isShowingLogoutModal: false,
      isShowingRemoveServerModal: false,

      isShowingFcmInfoModal: false,
      isShowingExpoInfoModal: false,
      isShowingCompanionPushInfoModal: false,

      serverToRemoveId: null,
      lastReceivedPairNotification: null,

      // Global notifications array for all notifications
      globalNotifications: [],
      isShowingGlobalNotificationCenter: false,

    };
  },
  computed: {
    isRustPlusConnected: function () {
      return this.steamId && this.rustplusToken;
    },
    unreadGlobalNotificationsCount: function () {
      return this.globalNotifications.filter(notification => !notification.read).length;
    },
  },
  mounted() {

    // Check if DataStore is available before using it
    if (window.DataStore && window.DataStore.Config) {
      // load rust+ info from store
      this.steamId = window.DataStore.Config.getSteamId();
      this.rustplusToken = window.DataStore.Config.getRustPlusToken();
    }

    if (window.DataStore && window.DataStore.Servers) {
      // load servers from store
      this.servers = window.DataStore.Servers.getServers();
    }

    // load global notifications from store
    this.loadGlobalNotifications();

    // setup fcm, expo and rust companion receivers
    this.fcmNotificationReceiver = new window.FCMNotificationReceiver(window.ipcRenderer);
    this.expoPushTokenReceiver = new window.ExpoPushTokenReceiver(window.ipcRenderer);
    this.rustCompanionReceiver = new window.RustCompanionReceiver(window.ipcRenderer);

    // setup fcm listeners
    this.fcmNotificationReceiver.on('register.success', this.onFCMRegisterSuccess);
    this.fcmNotificationReceiver.on('register.error', this.onFCMRegisterError);
    this.fcmNotificationReceiver.on('notifications.listen.started', this.onFCMNotificationsListenStarted);
    this.fcmNotificationReceiver.on('notifications.listen.stopped', this.onFCMNotificationsListenStopped);
    this.fcmNotificationReceiver.on('notifications.received', this.onFCMNotificationsReceived);
    this.fcmNotificationReceiver.on('notifications.error', this.onFCMNotificationsError);

    // setup expo listeners
    this.expoPushTokenReceiver.on('register.success', this.onExpoRegisterSuccess);
    this.expoPushTokenReceiver.on('register.error', this.onExpoRegisterError);

    // setup rust companion listeners
    this.rustCompanionReceiver.on('register.success', this.onRustCompanionRegisterSuccess);
    this.rustCompanionReceiver.on('register.error', this.onRustCompanionRegisterError);

    // setup notifications
    this.setupNotifications();

  },
  methods: {

    onFCMRegisterSuccess(data) {
      console.log("=== FCM Registration Success ===");
      console.log("FCM credentials received:", data.credentials);

      // update fcm status
      this.fcmStatus = Status.NOT_READY;
      this.fcmStatusMessage = "Registered";

      // save fcm credentials to store
      window.DataStore.FCM.setCredentials(data.credentials);
      console.log("FCM credentials saved to store");

      // start listening for notifications
      console.log("Starting to listen for notifications...");
      this.fcmNotificationReceiver.startListeningForNotifications(data.credentials, []);

    },

    onFCMRegisterError(data) {
      this.fcmStatus = Status.ERROR;
      this.fcmStatusMessage = data.error;
    },

    onFCMNotificationsListenStarted(data) {
      console.log("=== FCM Notifications Listen Started ===");

      // update fcm status
      this.fcmStatus = Status.READY;
      this.fcmStatusMessage = "Listening";
      console.log("FCM status updated to READY - Listening");

      // configure expo data
      var deviceId = window.DataStore.Config.getExpoDeviceId();
      var projectId = '49451aca-a822-41e6-ad59-955718d0ff9c';
      var appId = 'com.facepunch.rust.companion';
      var fcmToken = window.DataStore.FCM.getCredentials().fcm.token;

      console.log("Expo configuration:");
      console.log("- Device ID:", deviceId);
      console.log("- Project ID:", projectId);
      console.log("- App ID:", appId);
      console.log("- FCM Token:", fcmToken ? fcmToken.substring(0, 20) + "..." : "null");

      // register expo token
      this.expoStatus = Status.NOT_READY;
      this.expoStatusMessage = "Registering...";
      console.log("Registering Expo push token...");
      this.expoPushTokenReceiver.register(deviceId, projectId, appId, fcmToken);

    },

    onFCMNotificationsListenStopped(data) {
      this.fcmStatus = Status.NOT_READY;
      this.fcmStatusMessage = "Stopped Listening";
    },

    onFCMNotificationsReceived(data) {
      console.log("=== FCM Notification Received ===");
      console.log("Full notification data:", JSON.stringify(data, null, 2));

      // save persistent id to data store
      window.DataStore.FCM.addPersistentId(data.persistentId);
      console.log("Saved persistent ID:", data.persistentId);

      // make sure app data exists
      var appData = data.appData;
      if(!appData){
        console.log("FCM notification appData is null!");
        console.log("Available data keys:", Object.keys(data));
        return;
      }

      console.log("AppData found:", appData);
      
      // Log all appData keys and values for debugging
      console.log("=== DEBUG: All appData entries ===");
      appData.forEach((item, index) => {
        console.log(`appData[${index}]: key="${item.key}", value="${item.value}"`);
      });
      console.log("=== END DEBUG ===");

      // make sure app data has body
      const body = appData.find((item) => item.key === "body");
      if(!body){
        console.log("FCM notification appData has no body!");
        console.log("Available appData keys:", appData.map(item => item.key));
        console.log("Full appData:", appData);
        return;
      }

      console.log("Body found:", body.value);

      // parse body
      var notificationBody;
      try {
        notificationBody = JSON.parse(body.value);
        console.log("Parsed notification body:", notificationBody);
      } catch (error) {
        console.log("Failed to parse notification body:", error);
        console.log("Raw body value:", body.value);
        return;
      }

      // Check for channel in appData (Rust+ API notifications)
      const channelData = appData.find((item) => item.key === "channel");
      if (channelData) {
        console.log("Channel found in appData:", channelData.value);
        notificationBody.channel = parseInt(channelData.value);
      }

      // make sure body has type or channel
      if(!notificationBody.type && !notificationBody.channel){
        console.log("notification body has no type or channel!");
        console.log("Notification body:", notificationBody);
        console.log("Will still try to add to notification center...");
      }

      // handle server pairing
      if(notificationBody.type === 'server'){
        console.log("Server pairing notification detected");
        this.lastReceivedPairNotification = notificationBody;
        this.isShowingPairServerModal = true;
      }

      // Add notification to notification center for all notifications
      console.log("Adding notification to notification center...");
      this.addRustPlusNotificationToCenter(notificationBody, data);
      console.log("=== End FCM Notification Processing ===");

    },

    // add rust+ notification to notification center
    addRustPlusNotificationToCenter(notificationBody, data) {
      console.log("=== Adding Notification to Center ===");
      console.log("Notification body:", notificationBody);
      console.log("Full data object:", data);
      console.log("RustPlus component ref exists:", !!this.$refs.rustPlusComponent);
      
      // Extract channel from the notification data
      const channel = data.appData?.find(item => item.key === 'channel')?.value || notificationBody.channel;
      const channelId = data.appData?.find(item => item.key === 'channelId')?.value;
      const androidChannelId = data.appData?.find(item => item.key === 'gcm.notification.android_channel_id')?.value;
      
      console.log("Extracted channel:", channel);
      console.log("Extracted channelId:", channelId);
      console.log("Extracted android_channel_id:", androidChannelId);
      
      // Default values from notification body
      let notificationMessage = notificationBody.body || notificationBody.desc || '';
      let notificationTitle = notificationBody.title || 'Rust+ Notification';
      
      // Check if this is an alarm notification by multiple criteria
      const isAlarmNotification = 
        channel === '1004' || channel === 1004 ||
        channelId === 'alarm' ||
        androidChannelId === 'alarm' ||
        notificationBody.type === 'alarm';
      
      if (isAlarmNotification) {
        console.log("=== ALARM NOTIFICATION DETECTED ===");
        
        // Look for message and title in appData (prioritize these over notification body)
        const messageData = data.appData?.find(item => item.key === 'message');
        const titleData = data.appData?.find(item => item.key === 'title');
        const gcmBodyData = data.appData?.find(item => item.key === 'gcm.notification.body');
        const gcmTitleData = data.appData?.find(item => item.key === 'gcm.notification.title');
        
        // Use the direct message/title fields from appData for alarm notifications
        if (messageData) {
          console.log("Found message in appData:", messageData.value);
          notificationMessage = messageData.value;
        } else if (gcmBodyData) {
          console.log("Found gcm.notification.body in appData:", gcmBodyData.value);
          notificationMessage = gcmBodyData.value;
        }
        
        if (titleData) {
          console.log("Found title in appData:", titleData.value);
          notificationTitle = titleData.value;
        } else if (gcmTitleData) {
          console.log("Found gcm.notification.title in appData:", gcmTitleData.value);
          notificationTitle = gcmTitleData.value;
        }
        
        console.log("Final alarm title:", notificationTitle);
        console.log("Final alarm message:", notificationMessage);
      }
      
      console.log("Notification title:", notificationTitle);
      console.log("Notification message:", notificationMessage);
      
      if (this.$refs.rustPlusComponent) {
        // Add notification using the enhanced method
        this.$refs.rustPlusComponent.addNotification(
          channel || channelId || 'unknown', // Use channel for Rust+ API notifications
          notificationTitle,
          notificationMessage,
          notificationBody // Pass the full notification body as data
        );
        console.log("Notification added successfully");
      } else {
        console.log("RustPlus component ref not available - notification not added");
      }
      
      // Always add to global notification center regardless of server selection
      this.addGlobalNotification({
        title: notificationTitle,
        message: notificationMessage,
        channel: channel || channelId || 'unknown',
        type: notificationBody.type || 'notification',
        data: notificationBody
      });
      
      console.log("=== End Adding Notification to Center ===");
    },

    onFCMNotificationsError(data) {
      this.fcmStatus = Status.ERROR;
      this.fcmStatusMessage = "Notification Error";
    },

    onExpoRegisterSuccess(data) {
      console.log("=== Expo Registration Success ===");
      console.log("Expo registration data:", data);

      // update expo status
      this.expoStatus = Status.READY;
      this.expoStatusMessage = "Registered";

      // register with rust companion api if logged into steam
      if(this.isRustPlusConnected){
        console.log("Rust+ is connected, registering with companion API...");
        console.log("Steam ID:", this.steamId);
        console.log("Rust+ Token:", this.rustplusToken ? this.rustplusToken.substring(0, 20) + "..." : "null");

        this.companionPushStatus = Status.NOT_READY;
        this.companionPushMessage = "Registering...";

        /**
         * The Rust Companion API will update the expo token if an existing registration exists for a deviceId.
         * Rust+ uses the device name as the deviceId, so if a user has two devices with same name, it won't work.
         * So, we will use a unique deviceId per installation so notifications will work across multiple installs.
         */
        var expoDeviceId = window.DataStore.Config.getExpoDeviceId();
        var deviceId = '@jawadyzbk/rustLink:' + expoDeviceId;
        var rustplusToken = window.DataStore.Config.getRustPlusToken();

        console.log("Registering with companion API - Device ID:", deviceId);
        console.log("Expo Push Token:", data.expoPushToken ? data.expoPushToken.substring(0, 20) + "..." : "null");
        this.rustCompanionReceiver.register(deviceId, rustplusToken, data.expoPushToken);

      } else {
        console.log("Rust+ not connected, skipping companion API registration");
        this.companionPushStatus = Status.NOT_READY;
        this.companionPushMessage = "Steam Account not Connected";
      }

    },

    onExpoRegisterError(data) {
      this.expoStatus = Status.ERROR;
      this.expoStatusMessage = data.error;
    },

    onRustCompanionRegisterSuccess(data) {
      console.log("=== Rust Companion Registration Success ===");
      console.log("Companion registration data:", data);

      // update companion push status
      this.companionPushStatus = Status.READY;
      this.companionPushStatusMessage = "Registered";
      console.log("Companion push status updated to READY");

    },

    onRustCompanionRegisterError(data) {
      console.log("=== Rust Companion Registration Error ===");
      console.log("Companion registration error:", data);
      console.log("Error details:", {
        error: data.error,
        response_code: data.response_code,
        error_message: data.error ? data.error.message : "No error message",
        error_response: data.error && data.error.response ? data.error.response.data : "No response data"
      });
      
      this.companionPushStatus = Status.ERROR;
      
      // Provide more detailed error message
      let errorMessage = "Registration Failed";
      if (data.response_code === 500) {
        errorMessage = "Server Error (500) - Please try again later";
      } else if (data.response_code === 403) {
        errorMessage = "Token Expired";
      } else if (data.response_code === 400) {
        errorMessage = "Invalid Request";
      } else if (data.error && data.error.message) {
        errorMessage = data.error.message;
      }
      
      this.companionPushStatusMessage = errorMessage;

      // check if rustplus token needs to be refreshed
      if(data.response_code === 403){

        // remove cached rustplus token
        window.DataStore.Config.clearRustPlusToken();

        // tell user their rustplus token has expired
        alert("Your RustPlus token has expired. Please connect with RustPlus again.");

        // reload window
        window.location.reload();

      }

    },

    setupNotifications() {

      // stop listening for notifications if already listening
      this.fcmNotificationReceiver.stopListeningForNotifications();

      // check for existing fcm credentials
      var credentials = window.DataStore.FCM.getCredentials();
      if(credentials){

        // get persistent ids
        var persistentIds = window.DataStore.FCM.getPersistentIds();

        // clear saved persistent ids
        window.DataStore.FCM.clearPersistentIds();

        // start listening for notifications with existing credentials
        this.fcmNotificationReceiver.startListeningForNotifications(credentials, persistentIds);

      } else {

        // register for a new set of fcm credentials
        this.fcmStatus = "Registering...";
        this.fcmNotificationReceiver.register();

      }

    },

    confirmRemoveServer(event) {
      this.serverToRemoveId = event.id;
      this.isShowingRemoveServerModal = true;
    },

    removeServer() {

      // remove server by id
      window.DataStore.Servers.removeServerById(this.serverToRemoveId);

      // update in memory servers
      this.servers = window.DataStore.Servers.getServers();

      // clear server to remove id
      this.serverToRemoveId = null;

      // close modal
      this.isShowingRemoveServerModal = false;

      // remove selected server
      this.selectedServer = null;

    },

    logout() {

      // close logout modal
      this.isShowingLogoutModal = false;

      // forget servers
      window.DataStore.Servers.clearServers();

      // forget steam account
      window.DataStore.Config.clearSteamId();
      window.DataStore.Config.clearRustPlusToken();

      // clear in memory state, which will force user to connect steam
      this.servers = [];
      this.steamId = null;
      this.rustplusToken = null;
      this.selectedServer = null;

      // stop listening for notifications
      this.fcmNotificationReceiver.stopListeningForNotifications();

    },

    onRustPlusConnected(event) {

      // save rust+ info to store
      window.DataStore.Config.setSteamId(event.steamId);
      window.DataStore.Config.setRustPlusToken(event.token);

      // update steam id and token in memory
      this.steamId = event.steamId;
      this.rustplusToken = event.token;

      // setup notifications
      this.setupNotifications();

    },

    onAddServer(event) {

      // get server data from event
      var server = {
        id: event.id || window.uuidv4(),
        name: event.name || "New Server",
        ip: event.ip,
        port: event.port,
        playerId: event.playerId,
        playerToken: event.playerToken,
      };

      // add or update server
      window.DataStore.Servers.addOrUpdateServer(server);

      // update servers in ui
      this.servers = window.DataStore.Servers.getServers();

      // set server as selected
      this.selectedServer = server;

    },

    onServerSelected(event) {

      // server that the user selected
      var server = event.server;

      // clear selected server if no server was selected
      if(server == null){
        this.selectedServer = null;
        return;
      }

      // if user selected same server, clear selected server
      if(this.selectedServer && this.selectedServer.id === server.id){
        this.selectedServer = null;
        return;
      }

      // update selected server
      this.selectedServer = event.server;

    },

    // Global notification management methods
    addGlobalNotification(notification) {
      console.log("=== Adding Global Notification ===");
      console.log("Notification data:", notification);
      
      // Try to identify server from notification data
      let serverInfo = null;
      
      // First check if we have a selected server
      if (this.selectedServer) {
        serverInfo = {
          name: this.selectedServer.name,
          id: this.selectedServer.id
        };
      } else {
        // Try to identify server from notification channel or data
        if (notification.channel && window.DataStore && window.DataStore.Servers) {
          // Look for server with matching channel
          const servers = window.DataStore.Servers.getServers();
          for (const server of servers) {
            if (server.channels && server.channels.includes(notification.channel)) {
              serverInfo = {
                name: server.name,
                id: server.id
              };
              break;
            }
          }
        }
        
        // If still no server found, try to extract from notification data
        if (!serverInfo && notification.data) {
          if (notification.data.serverId && window.DataStore && window.DataStore.Servers) {
            const servers = window.DataStore.Servers.getServers();
            const server = servers.find(s => s.id === notification.data.serverId);
            if (server) {
              serverInfo = {
                name: server.name,
                id: server.id
              };
            }
          } else if (notification.data.serverName) {
            serverInfo = {
              name: notification.data.serverName,
              id: notification.data.serverId || 'unknown'
            };
          }
        }
      }
      
      // Add server information to notification
      if (serverInfo) {
        notification.serverName = serverInfo.name;
        notification.serverId = serverInfo.id;
      } else {
        notification.serverName = 'Unknown Server';
        notification.serverId = 'unknown';
      }
      
      // Add timestamp and unique ID
      notification.timestamp = Date.now();
      notification.id = Date.now() + Math.random();
      notification.read = false;
      
      console.log("Final notification object:", notification);
      
      // Add to global notifications
      this.globalNotifications.unshift(notification);
      
      // Keep only last 100 notifications
      if (this.globalNotifications.length > 100) {
        this.globalNotifications = this.globalNotifications.slice(0, 100);
      }
      
      // Save to persistent storage
      this.saveGlobalNotifications();
      
      console.log("Global notifications count:", this.globalNotifications.length);
      console.log("=== End Adding Global Notification ===");
    },

    markGlobalNotificationAsRead(notificationId) {
      const notification = this.globalNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        this.saveGlobalNotifications();
      }
    },

    clearAllGlobalNotifications() {
      this.globalNotifications = [];
      this.saveGlobalNotifications();
    },

    saveGlobalNotifications() {
      if (window.DataStore && window.DataStore.Notifications) {
        window.DataStore.Notifications.setNotifications(this.globalNotifications);
      }
    },

    loadGlobalNotifications() {
      if (window.DataStore && window.DataStore.Notifications) {
        this.globalNotifications = window.DataStore.Notifications.getNotifications() || [];
      }
    },

    formatNotificationTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      // For older notifications, show full date and time
      const options = { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      
      // If it's from this year, don't show the year
      if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('en-US', options);
      } else {
        return date.toLocaleDateString('en-US', { ...options, year: 'numeric' });
      }
    },

    // Helper methods for notification styling
    getGlobalNotificationIconBg(notification) {
      if (notification.read) {
        return 'bg-gray-100';
      }
      
      // Color based on notification type/channel
      if (notification.channel === 1001 || notification.type === 'pairing') {
        return 'bg-yellow-100';
      } else if (notification.channel === 1002 || notification.type === 'player_login') {
        return 'bg-green-100';
      } else if (notification.channel === 1003 || notification.type === 'player_death') {
        return 'bg-red-100';
      } else if (notification.channel === 1004 || notification.type === 'smart_alarm') {
        return 'bg-orange-100';
      } else if (notification.type === 'team_message') {
        return 'bg-blue-100';
      } else if (notification.type === 'team_changed') {
        return 'bg-purple-100';
      } else if (notification.type === 'entity_changed') {
        return 'bg-indigo-100';
      }
      return 'bg-gray-100';
    },

    getGlobalNotificationIconColor(notification) {
      if (notification.read) {
        return 'text-gray-500';
      }
      
      // Color based on notification type/channel
      if (notification.channel === 1001 || notification.type === 'pairing') {
        return 'text-yellow-600';
      } else if (notification.channel === 1002 || notification.type === 'player_login') {
        return 'text-green-600';
      } else if (notification.channel === 1003 || notification.type === 'player_death') {
        return 'text-red-600';
      } else if (notification.channel === 1004 || notification.type === 'smart_alarm') {
        return 'text-orange-600';
      } else if (notification.type === 'team_message') {
        return 'text-blue-600';
      } else if (notification.type === 'team_changed') {
        return 'text-purple-600';
      } else if (notification.type === 'entity_changed') {
        return 'text-indigo-600';
      }
      return 'text-gray-500';
    },

    getNotificationTypeLabel(notification) {
      if (notification.channel === 1001 || notification.type === 'pairing') {
        return 'Pairing';
      } else if (notification.channel === 1002 || notification.type === 'player_login') {
        return 'Player Login';
      } else if (notification.channel === 1003 || notification.type === 'player_death') {
        return 'Player Death';
      } else if (notification.channel === 1004 || notification.type === 'smart_alarm') {
        return 'Smart Alarm';
      } else if (notification.type === 'team_message') {
        return 'Team Message';
      } else if (notification.type === 'team_changed') {
        return 'Team Changed';
      } else if (notification.type === 'entity_changed') {
        return 'Entity Changed';
      }
      return null;
    },

    getNotificationTypeBadgeClass(notification) {
      if (notification.channel === 1001 || notification.type === 'pairing') {
        return 'bg-yellow-100 text-yellow-800';
      } else if (notification.channel === 1002 || notification.type === 'player_login') {
        return 'bg-green-100 text-green-800';
      } else if (notification.channel === 1003 || notification.type === 'player_death') {
        return 'bg-red-100 text-red-800';
      } else if (notification.channel === 1004 || notification.type === 'smart_alarm') {
        return 'bg-orange-100 text-orange-800';
      } else if (notification.type === 'team_message') {
        return 'bg-blue-100 text-blue-800';
      } else if (notification.type === 'team_changed') {
        return 'bg-purple-100 text-purple-800';
      } else if (notification.type === 'entity_changed') {
        return 'bg-indigo-100 text-indigo-800';
      }
      return 'bg-gray-100 text-gray-800';
    }

  },
}
</script>
