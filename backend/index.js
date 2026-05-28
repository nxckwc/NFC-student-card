import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'

const app = express()
const port = 3101

// Swagger
const swaggerOptions = {
    definition : {
        openapi: '3.0.0',
        info: {
            title: 'Nack API',
            version: '1.0.0',
            description: 'Documentation for Nack :D',
        },
        servers: [
            {url: `http://localhost:${port}`}
        ],
    },
    apis: ['./*.js']
}
const swaggerSpec = swaggerJsdoc(swaggerOptions)


app.use(express.json())
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
app.get('/', (req, res) => {
  res.send('Hello World! Access /api-docs to see APi documentation')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})