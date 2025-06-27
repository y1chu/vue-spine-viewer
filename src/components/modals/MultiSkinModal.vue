<template>
    <div class="multi-skin-popup">
        <h3>Select Skins</h3>
        <div class="skin-list">
            <div v-for="skinName in phaserStore.skins" :key="skinName" class="skin-list-item">
                <input type="checkbox" :id="`skin-checkbox-${skinName}`" :value="skinName" v-model="selectedSkins" />
                <label :for="`skin-checkbox-${skinName}`">{{ skinName }}</label>
            </div>
        </div>
        <div class="popup-button-container">
            <button @click="applySkins" class="control-button apply-button">Apply</button>
            <button @click="$emit('close')" class="control-button close-button">Close</button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { phaserStore } from '@/store/phaserStore.js';
const emit = defineEmits(['close']);

// Pre-select currently active skins
const currentSkin = phaserStore.spineObject?.skeleton.skin;
const initialSkins = currentSkin?.componentSkinNames || (currentSkin ? [currentSkin.name] : []);
const selectedSkins = ref(initialSkins);

const applySkins = () => {
    const { skeleton } = phaserStore.spineObject;
    if (selectedSkins.value.length === 0) {
        skeleton.setSkin(null);
    } else if (selectedSkins.value.length === 1) {
        skeleton.setSkinByName(selectedSkins.value[0]);
    } else {
        const newSkin = new window.spine.Skin("composite-skin");
        newSkin.componentSkinNames = selectedSkins.value; // Store for state restoration
        selectedSkins.value.forEach((skinName) => {
            const skinToAdd = skeleton.data.findSkin(skinName);
            if (skinToAdd) newSkin.addSkin(skinToAdd);
        });
        skeleton.setSkin(newSkin);
    }
    skeleton.setSlotsToSetupPose();
    emit('close');
};
</script>