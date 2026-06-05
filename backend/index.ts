import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import cors from 'cors'
import { login, logout, register, session } from './src/controllers/auth.js'
import 'dotenv/config'
import { createStudent, getStudent, getStudentByCard } from './src/controllers/student.js'

const app = express()
const port = 3100
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'

// Swagger
const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Nack API',
            version: '1.0.0',
            description: 'Documentation for Nack :D',
        },
        servers: [
            { url: `http://localhost:${port}` }
        ],
    },
    apis: ['./*.ts', './src/controllers/*.ts']
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

app.use(express.json())

app.use(cors({
  origin: frontendOrigin,
  credentials: true
}))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

/**
 * @swagger
 * /:
 *  get:
 *      summary: Just test endpoint! Hello world!
 *      responses:
 *          200:
 *              description: Everything fine
 */
app.get('/', (_req, res) => {
  res.send('Hello World! Access /api-docs to see API documentation')
})

app.post('/auth/register', register)
app.post('/auth/login', login)
app.get('/auth/session', session)
app.post('/auth/logout', logout)

app.post('/student', createStudent)
app.get('/student/card/:studentCardId', getStudentByCard)
app.get('/student/:studentId', getStudent)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
