import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS for local dev
  app.enableCors({
    origin: [
      'http://localhost:5173', // Vite default
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  })

  // Global API prefix to align with frontend proxy
  app.setGlobalPrefix('api')

  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}/api`)
}
bootstrap()
