<script setup>

</script>

<template>
    <div class="container">
        <div class="navbar">
            <div class="left">
                <img src="../assets/logo/logo-vert.png" alt="">
            </div>
            <div class="center">
                <ul>
                    <li>HOME</li>
                    <li>ABOUT</li>
                    <li>CONTACT</li>
                </ul>
            </div>
            <div class="right">
                <button class="btn">LOGIN</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.container {
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
}

img {
    width: 100px;
}

.navbar{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    width: 100%;
    height: 100%;
    background: linear-gradient(#0e0e0e40, transparent);
    backdrop-filter: blur(10px);
}

ul{
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
}


</style>