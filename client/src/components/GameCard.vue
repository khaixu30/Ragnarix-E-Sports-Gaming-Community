<template>
    <div class="card-container">
        <div class="image">
            <img src="../assets/games_covers/battlefield.webp" alt="">
        </div>
        <div class="text">
            <div class="heading-tags">
                <div class="heading">
                    <h2><a href="">Battlefield: REDSEC</a></h2>
                </div>
                <div class="tags">
                    <span class="tag">BATTLEROYALE</span>
                    <span class="tag">FPS</span>
                    <span class="tag">ACTION</span>
                    <span class="tag">ADVENTURE</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>

</script>

<style scoped>
.card-container{
    width: 300px !important; 
    height: 400px;
    overflow: hidden;
    position: relative;
}

.card-container:hover .text{
    opacity: 1;
}

.card-container:hover .heading-tags{
    bottom: 0;
}

.card-container:hover{
    box-shadow: 1px 1px 10px #f7fffc30;
}

.image{
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
}
img{
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.text{
    width: 100%;
    height: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 10;
    background: #0e0e0e40;
    backdrop-filter: blur(5px);
    opacity: 0;
    transition: all 0.6s ease-in-out;
}
.heading-tags{
    position: absolute;
    padding: 16px;
    bottom: -500px;
    left: 0;
    transition: all 0.6s ease-in-out;
}
.tags{
    width: 100%;
    display: flex;
    /* justify-content: center; */
    /* align-items: center; */
    flex-wrap: wrap;
    gap: 4px;
}
.tag{
    padding: 4px 8px;
    background: var(--primary);
    font-size: 12px;
    border-radius: 20px;
}
</style>