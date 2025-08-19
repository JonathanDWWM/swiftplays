<template>
  <svg 
    :width="size" 
    :height="size" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M6 9H4.5C3.83696 9 3.20107 9.26339 2.73223 9.73223C2.26339 10.2011 2 10.837 2 11.5C2 12.163 2.26339 12.7989 2.73223 13.2678C3.20107 13.7366 3.83696 14 4.5 14H6" 
      stroke="currentColor" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />
    <path 
      d="M18 9H19.5C20.163 9 20.7989 9.26339 21.2678 9.73223C21.7366 10.2011 22 10.837 22 11.5C22 12.163 21.7366 12.7989 21.2678 13.2678C20.7989 13.7366 20.163 14 19.5 14H18" 
      stroke="currentColor" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />
    <path 
      d="M6 9C6 7.4087 6.63214 5.88258 7.75736 4.75736C8.88258 3.63214 10.4087 3 12 3C13.5913 3 15.1174 3.63214 16.2426 4.75736C17.3679 5.88258 18 7.4087 18 9V14C18 15.5913 17.3679 17.1174 16.2426 18.2426C15.1174 19.3679 13.5913 20 12 20C10.4087 20 8.88258 19.3679 7.75736 18.2426C6.63214 17.1174 6 15.5913 6 14V9Z" 
      stroke="currentColor" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />
    <path 
      d="M12 20V22" 
      stroke="currentColor" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />
    <path 
      d="M8 22H16" 
      stroke="currentColor" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  size?: number | string
}

withDefaults(defineProps<Props>(), {
  size: 20
})
</script>