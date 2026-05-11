<script setup>
import { ref } from 'vue';
import Sidebar from '../../components/DashboardComponents/Sidebar.vue';
import ChatBrowser from '../../components/ChatComponents/ChatBrowser.vue';
import ChatWindow from '../../components/ChatComponents/ChatWindow.vue';

const selectedRoom = ref(null);

const onSelectRoom = (room) => {
    selectedRoom.value = room;
};
</script>

<template>
    <div class="chat-layout">
        <Sidebar />
        <div class="chat-area">
            <ChatBrowser @select-room="onSelectRoom" />
            <ChatWindow :room="selectedRoom" />
        </div>
    </div>
</template>

<style scoped>
.chat-layout {
    display: flex;
    height: 100vh;
    width: 100%;
    overflow: hidden;
    background: #1a1410;
}

.chat-area {
    display: flex;
    flex: 1;
    overflow: hidden;
}
</style>