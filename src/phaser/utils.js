export const toText = (file) =>
  new Promise((resolve) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.readAsText(file)
  })

export const toURL = (file) => URL.createObjectURL(file)
