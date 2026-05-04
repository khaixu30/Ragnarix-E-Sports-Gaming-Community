<script setup>
import EventsContainer from '../components/EventPageComponents/EventsContainer.vue';
import EventsHero from '../components/EventPageComponents/EventsHero.vue';
import Footer from '../components/Footer.vue';
import Navbar from '../components/Navbar.vue';


</script>

<template>
    <Navbar />
    <EventsHero />
    <EventsContainer status="Upcoming" />
    <EventsContainer status="Live" />
    <Footer />
</template>

<style scoped css>

</style>