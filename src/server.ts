import { app } from './app'

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('🚀 Server started on port 3333!')
  })
