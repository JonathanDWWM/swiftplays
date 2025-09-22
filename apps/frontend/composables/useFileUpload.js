export const useFileUpload = () => {
  const { $api } = useNuxtApp()
  
  const uploadFiles = async (files) => {
    try {
      const formData = new FormData()
      
      // Ajouter tous les fichiers au FormData
      Array.from(files).forEach(file => {
        formData.append('evidence', file)
      })
      
      const response = await $api('/api/upload/evidence', {
        method: 'POST',
        body: formData,
        // Pas de content-type car FormData gère automatiquement multipart/form-data
      })
      
      if (response.success) {
        return response.data.files.map(file => file.url)
      } else {
        throw new Error(response.message || 'Erreur lors de l\'upload')
      }
    } catch (error) {
      console.error('Erreur upload:', error)
      throw error
    }
  }
  
  const deleteFile = async (filename) => {
    try {
      const response = await $api(`/api/upload/evidence/${filename}`, {
        method: 'DELETE'
      })
      
      return response.success
    } catch (error) {
      console.error('Erreur suppression fichier:', error)
      throw error
    }
  }
  
  const validateFile = (file) => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/mov', 'video/avi', 'video/x-msvideo']
    
    if (file.size > maxSize) {
      throw new Error(`Le fichier ${file.name} dépasse la taille limite de 50MB`)
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Le type de fichier ${file.type} n'est pas autorisé`)
    }
    
    return true
  }
  
  const validateFiles = (files) => {
    const maxFiles = 5
    
    if (files.length > maxFiles) {
      throw new Error(`Vous ne pouvez pas uploader plus de ${maxFiles} fichiers`)
    }
    
    Array.from(files).forEach(validateFile)
    return true
  }
  
  return {
    uploadFiles,
    deleteFile,
    validateFile,
    validateFiles
  }
}