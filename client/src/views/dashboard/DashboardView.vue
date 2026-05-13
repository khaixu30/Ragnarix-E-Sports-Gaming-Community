<script setup>
import Sidebar from '../../components/DashboardComponents/Sidebar.vue';
</script>

<template>
    <div class="dashboard-layout">

        <Sidebar />
        <router-view></router-view>
    </div>
</template>

<style scoped>
.dashboard-layout{
    display: flex;
    width: 100%;
}
</style>