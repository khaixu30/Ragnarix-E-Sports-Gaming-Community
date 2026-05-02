<script setup>

</script>

<template>
    <div class="container">
        <div class="hero-image">
            <img src="../../assets/backgrounds/hero-bg.png" alt="">
            <div class="fade-effect"></div>
        </div>
        <div class="hero-text">
            <div class="left-text">
                <h1>Play. <span class="highlight-heading">Compete.</span> Win</h1>
                <p class="tag-line">Compete to become the top.</p>
            </div>
        </div>

        <div class="right-container">
            <div class="icon-container">
                <div class="icon">
                    <i class="fa-solid fa-gamepad"></i>
                </div>
                <div class="text">
                    <h2>Play</h2>
                </div>
            </div>
            <div class="icon-container">
                <div class="icon">
                    <i class="fa-solid fa-trophy"></i>
                </div>
                <div class="text">
                    <h2>Win</h2>
                </div>
            </div>
            <div class="icon-container">
                <div class="icon">
                    <i class="fa-solid fa-users"></i>
                </div>
                <div class="text">
                    <h2>Enguage</h2>
                </div>
            </div>
        </div>
    </div>
</template>

<style css scoped>
.container {
    width: 100%;
    height: 90vh;
    overflow: hidden;
    position: relative;
}

.hero-image{
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: -1;
    display: flex;
    justify-content: center;
    align-items: center;
}

img {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    object-fit: cover;
    object-position: center;
}

.fade-effect {
    width: 100%;
    height: 30%;
    background: linear-gradient(to top, var(--bg-color), transparent, transparent);
    position: absolute;
    bottom: 0;
    left: 0;
}

.hero-text {
    width: 50%;
    height: 100%;
    padding: 24px;
    display: flex;
    align-items: center;
}

h1 {
    font-size: 96px;
    width: 80%;
    line-height: 0.8em;
}

.tag-line {
    font-size: 20px;
}

.right-container{
    width: 50%;
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    padding: 24px;

    display: flex;
    justify-content: center;
    align-items: end;
    flex-direction: column;
    gap: 20px;
}

.icon-container{
    display: flex;
    justify-content: right;
    align-items: center;
    flex-direction: row-reverse;
    gap: 12px;
}
.icon{
    width: 120px;
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 40px;
    border: 2px solid var(--primary-color);
    border-radius: 50%;
    color: var(--primary-color);
    opacity: 0.4;
    transition: all 0.2s ease-out;
}
.text h2{
    font-size: 44px;
    line-height: 32px;
    color: var(--text-color)
}

.text{
    right: -20%;
    opacity: 0;
    transform: translateX(50%);
    transition: all 0.2s ease-out;
}

.icon-container:hover .icon{
    opacity: 1;
    box-shadow: 1px 1px 10px var(--primary-color);
}

.icon-container:hover .icon i{
    filter: drop-shadow(1px 1px 10px var(--primary-color));
}

.icon-container:hover .text{
    transform: translateX(0%);
    opacity: 1;
}

</style>
